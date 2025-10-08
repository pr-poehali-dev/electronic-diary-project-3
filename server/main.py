from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock база данных
db = {
    "users": [
        {"id": 1, "login": "22", "password": "22", "role": "admin", "full_name": "Администратор", "avatar_color": "#FF5733", "avatar_emoji": "🚀"},
        {"id": 2, "login": "teacher1", "password": "123", "role": "teacher", "full_name": "Иванов Иван Иванович", "avatar_color": "#2563EB", "avatar_emoji": "👨‍🏫"},
        {"id": 3, "login": "student1", "password": "123", "role": "student", "full_name": "Сидоров Петр", "avatar_color": "#10B981", "avatar_emoji": "🎓"},
    ],
    "classes": [
        {"id": 1, "name": "10А", "year": 2024},
        {"id": 2, "name": "11Б", "year": 2024},
    ],
    "subjects": [
        {"id": 1, "name": "Математика"},
        {"id": 2, "name": "Русский язык"},
        {"id": 3, "name": "Физика"},
    ],
    "teachers": [
        {"id": 1, "full_name": "Иванов Иван Иванович", "login": "teacher1", "password": "123", "user_id": 2},
        {"id": 2, "full_name": "Петрова Мария Сергеевна", "login": "teacher2", "password": "123", "user_id": 4},
    ],
    "students": [
        {"id": 1, "full_name": "Сидоров Петр", "login": "student1", "password": "123", "class_name": "10А", "class_id": 1},
        {"id": 2, "full_name": "Иванова Анна", "login": "student2", "password": "123", "class_name": "10А", "class_id": 1},
    ],
    "grades": [],
    "schedule": [],
    "homework": [],
}

class LoginRequest(BaseModel):
    login: str
    password: str

class ProfileUpdate(BaseModel):
    user_id: int
    avatar_color: str
    avatar_emoji: str

@app.post("/auth")
async def login(request: LoginRequest):
    user = next((u for u in db["users"] if u["login"] == request.login and u["password"] == request.password), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_data = user.copy()
    user_data.pop("password", None)
    
    if user["role"] == "teacher":
        teacher = next((t for t in db["teachers"] if t["user_id"] == user["id"]), None)
        user_data["teacher_id"] = teacher["id"] if teacher else None
    elif user["role"] == "student":
        student = next((s for s in db["students"] if s["login"] == user["login"]), None)
        user_data["student_id"] = student["id"] if student else None
        user_data["class_id"] = student["class_id"] if student else None
    
    return {"success": True, "user": user_data}

@app.post("/profile")
async def update_profile(request: ProfileUpdate):
    user = next((u for u in db["users"] if u["id"] == request.user_id), None)
    if user:
        user["avatar_color"] = request.avatar_color
        user["avatar_emoji"] = request.avatar_emoji
    return {"success": True}

@app.get("/admin")
async def get_admin_data(entity: str, teacher_id: Optional[int] = None, class_id: Optional[int] = None):
    if entity in db:
        return {"data": db[entity]}
    return {"data": []}

@app.post("/admin")
async def create_entity(entity: str, data: dict):
    if entity in db:
        new_id = max([item["id"] for item in db[entity]], default=0) + 1
        data["id"] = new_id
        db[entity].append(data)
        return {"success": True, "id": new_id}
    raise HTTPException(status_code=400, detail="Invalid entity")

@app.delete("/admin")
async def delete_entity(entity: str, id: int):
    if entity in db:
        db[entity] = [item for item in db[entity] if item["id"] != id]
        return {"success": True}
    raise HTTPException(status_code=400, detail="Invalid entity")

@app.get("/grades")
async def get_grades(class_id: int, subject_id: int):
    return {"data": db["grades"]}

@app.post("/grades")
async def add_grade(data: dict):
    new_id = len(db["grades"]) + 1
    data["id"] = new_id
    db["grades"].append(data)
    return {"success": True, "id": new_id}

@app.delete("/grades")
async def delete_grade(id: int):
    db["grades"] = [g for g in db["grades"] if g["id"] != id]
    return {"success": True}

@app.get("/")
async def root():
    return {"message": "School Diary API", "status": "running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
