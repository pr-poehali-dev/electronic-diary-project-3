import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

// Замените на ваш URL после деплоя на Render
const API_BASE = 'https://school-diary-api.onrender.com';
const API_AUTH = `${API_BASE}/auth`;
const API_ADMIN = `${API_BASE}/admin`;
const API_GRADES = `${API_BASE}/grades`;
const API_HOMEWORK = `${API_BASE}/homework`;
const API_PROFILE = `${API_BASE}/profile`;

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const EMOJIS = ['👤', '🎓', '📚', '✏️', '🌟', '🚀', '💼', '👨‍🏫', '👩‍🏫', '🧑‍🎓'];
const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const MOCK_DATA = {
  classes: [
    { id: 1, name: '10А', year: 2024 },
    { id: 2, name: '11Б', year: 2024 }
  ],
  subjects: [
    { id: 1, name: 'Математика' },
    { id: 2, name: 'Русский язык' },
    { id: 3, name: 'Физика' }
  ],
  teachers: [
    { id: 1, full_name: 'Иванов Иван Иванович', login: 'teacher1', password: '123', user_id: 2 },
    { id: 2, full_name: 'Петрова Мария Сергеевна', login: 'teacher2', password: '123', user_id: 3 }
  ],
  students: [
    { id: 1, full_name: 'Сидоров Петр', login: 'student1', password: '123', class_name: '10А', class_id: 1 },
    { id: 2, full_name: 'Иванова Анна', login: 'student2', password: '123', class_name: '10А', class_id: 1 }
  ],
  grades: [],
  schedule: [],
  homework: []
};

interface User {
  id: number;
  login: string;
  role: string;
  full_name: string;
  avatar_color?: string;
  avatar_emoji?: string;
  teacher_id?: number;
  student_id?: number;
  class_id?: number;
}

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('👤');
  const [selectedColor, setSelectedColor] = useState('#2563EB');

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);

  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [editingGradeComment, setEditingGradeComment] = useState<{id: number, comment: string} | null>(null);

  const handleLogin = async () => {
    try {
      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setIsLoggedIn(true);
        setSelectedEmoji(data.user.avatar_emoji || '👤');
        setSelectedColor(data.user.avatar_color || '#2563EB');
        toast.success('Вход выполнен');
      } else {
        toast.error('Неверный логин или пароль');
      }
    } catch (error: any) {
      toast.error('Ошибка входа');
    }
  };

  const updateProfile = async () => {
    try {
      await fetch(API_PROFILE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          avatar_color: selectedColor,
          avatar_emoji: selectedEmoji
        })
      });
      
      if (user) {
        setUser({ ...user, avatar_color: selectedColor, avatar_emoji: selectedEmoji });
      }
      
      toast.success('Профиль обновлен');
      setShowProfile(false);
    } catch (error) {
      toast.error('Ошибка обновления профиля');
    }
  };

  const loadData = async () => {
    if (!isLoggedIn) return;
    
    try {
      const classesRes = await fetch(`${API_ADMIN}?entity=classes`);
      const classesData = await classesRes.json();
      setClasses(classesData.data || []);
      
      const subjectsRes = await fetch(`${API_ADMIN}?entity=subjects`);
      const subjectsData = await subjectsRes.json();
      setSubjects(subjectsData.data || []);
      
      if (user?.role === 'admin') {
        const teachersRes = await fetch(`${API_ADMIN}?entity=teachers`);
        const teachersData = await teachersRes.json();
        setTeachers(teachersData.data || []);
        
        const studentsRes = await fetch(`${API_ADMIN}?entity=students`);
        const studentsData = await studentsRes.json();
        setStudents(studentsData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadGrades = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    try {
      const response = await fetch(`${API_GRADES}?class_id=${selectedClass}&subject_id=${selectedSubject}`);
      const data = await response.json();
      setGradesData(data.data || []);
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const loadSchedule = async () => {
    if (!selectedClass) return;
    setSchedule(MOCK_DATA.schedule);
  };

  const loadHomework = async () => {
    if (!selectedClass) return;
    setHomework(MOCK_DATA.homework);
  };

  useEffect(() => {
    loadData();
    if (user?.role === 'student' && user?.class_id) {
      setSelectedClass(user.class_id);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadGrades();
    }
  }, [selectedClass, selectedSubject]);

  useEffect(() => {
    if (selectedClass) {
      loadSchedule();
      loadHomework();
    }
  }, [selectedClass]);

  const addGrade = async (studentId: number, grade: number) => {
    toast.success('Оценка добавлена (mock режим)');
  };

  const deleteGrade = async (gradeId: number) => {
    toast.success('Оценка удалена (mock режим)');
  };

  const updateGradeComment = async (gradeId: number, comment: string) => {
    try {
      await fetch(`${API_GRADES}?id=${gradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
      });
      toast.success('Примечание обновлено');
      setEditingGradeComment(null);
      loadGrades();
    } catch (error) {
      toast.error('Ошибка обновления примечания');
    }
  };

  const createEntity = async (entity: string, data: any) => {
    toast.success('Создано (mock режим)');
  };

  const deleteEntity = async (entity: string, id: number) => {
    toast.success('Удалено (mock режим)');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center text-4xl mb-2">
              📚
            </div>
            <CardTitle className="text-3xl">Электронный дневник</CardTitle>
            <CardDescription>Войдите в систему</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Логин</Label>
              <Input 
                value={login} 
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Введите логин"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label>Пароль</Label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full" size="lg">
              <Icon name="LogIn" className="mr-2" size={18} />
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📚</div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Электронный дневник</h1>
              <p className="text-sm text-gray-500">
                {user?.role === 'admin' && 'Администратор'}
                {user?.role === 'teacher' && 'Учитель'}
                {user?.role === 'student' && 'Ученик'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: user?.avatar_color || '#2563EB', color: 'white' }}
              >
                {user?.avatar_emoji || '👤'}
              </div>
              <span className="font-medium">{user?.full_name}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(false)}>
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user?.role === 'admin' && <AdminPanel 
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          students={students}
          createEntity={createEntity}
          deleteEntity={deleteEntity}
          loadData={loadData}
          schedule={schedule}
        />}
        
        {user?.role === 'teacher' && <TeacherPanel 
          user={user}
          classes={classes}
          subjects={subjects}
          teacherSubjects={teacherSubjects}
          gradesData={gradesData}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          addGrade={addGrade}
          deleteGrade={deleteGrade}
          schedule={schedule}
          homework={homework}
          loadSchedule={loadSchedule}
          loadHomework={loadHomework}
          createEntity={createEntity}
        />}
        
        {user?.role === 'student' && <StudentPanel 
          user={user}
          subjects={subjects}
          schedule={schedule}
          homework={homework}
          gradesData={gradesData}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />}
      </main>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки профиля</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Выберите эмодзи</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-12 h-12 rounded-lg border-2 text-2xl transition ${
                      selectedEmoji === emoji ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Выберите цвет</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-lg border-2 transition ${
                      selectedColor === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="pt-4">
              <div 
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: selectedColor, color: 'white' }}
              >
                {selectedEmoji}
              </div>
            </div>
            <Button onClick={updateProfile} className="w-full">
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminPanel({ classes, subjects, teachers, students, createEntity, deleteEntity, loadData, schedule }: any) {
  const [newClass, setNewClass] = useState({ name: '', year: 2025 });
  const [newSubject, setNewSubject] = useState('');
  const [newTeacher, setNewTeacher] = useState({ login: '', password: '', full_name: '' });
  const [newStudent, setNewStudent] = useState({ login: '', password: '', full_name: '', class_id: '' });
  const [scheduleForm, setScheduleForm] = useState({ class_id: '', subject_id: '', teacher_id: '', day_of_week: 1, lesson_number: 1 });
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedClassForStats, setSelectedClassForStats] = useState<number | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_ADMIN}?entity=stats`);
      const data = await res.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error loading stats');
    }
  };

  const loadClassStats = async (classId: number) => {
    try {
      const res = await fetch(`${API_ADMIN}?entity=stats&class_id=${classId}`);
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('Error loading class stats');
      return null;
    }
  };

  const updateUser = async (entity: string, userData: any) => {
    try {
      await fetch(`${API_ADMIN}?entity=${entity}&id=${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      toast.success('Обновлено');
      loadData();
      setEditingTeacher(null);
      setEditingStudent(null);
    } catch (error) {
      toast.error('Ошибка обновления');
    }
  };

  return (
    <Tabs defaultValue="stats" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="stats">
          <Icon name="BarChart3" size={16} className="mr-2" />
          Статистика
        </TabsTrigger>
        <TabsTrigger value="users">
          <Icon name="Users" size={16} className="mr-2" />
          Пользователи
        </TabsTrigger>
        <TabsTrigger value="classes">
          <Icon name="School" size={16} className="mr-2" />
          Классы
        </TabsTrigger>
        <TabsTrigger value="subjects">
          <Icon name="BookOpen" size={16} className="mr-2" />
          Предметы
        </TabsTrigger>
        <TabsTrigger value="schedule">
          <Icon name="Calendar" size={16} className="mr-2" />
          Расписание
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stats" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Всего учеников</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.total_students || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Всего учителей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.total_teachers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Всего классов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats?.total_classes || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Средний балл</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats?.overall_avg ? stats.overall_avg.toFixed(2) : '0.00'}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Статистика по классам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {classes.map((c: any) => (
                <ClassStatsCard key={c.id} classData={c} loadClassStats={loadClassStats} />
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Учителя</CardTitle>
              <CardDescription>Создание и управление учителями</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input placeholder="ФИО" value={newTeacher.full_name} onChange={(e) => setNewTeacher({...newTeacher, full_name: e.target.value})} />
                <Input placeholder="Логин" value={newTeacher.login} onChange={(e) => setNewTeacher({...newTeacher, login: e.target.value})} />
                <Input placeholder="Пароль" type="password" value={newTeacher.password} onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})} />
                <Button onClick={() => {
                  createEntity('teacher', newTeacher);
                  setNewTeacher({ login: '', password: '', full_name: '' });
                }} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать учителя
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {teachers.map((t: any) => (
                  <div key={t.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                    <div>
                      <div className="font-medium">{t.full_name}</div>
                      <div className="text-sm text-gray-500">Логин: {t.login}</div>
                      <div className="text-sm text-gray-500">Пароль: {t.password}</div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Icon name="Edit" size={14} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Редактировать учителя</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Input 
                              defaultValue={t.full_name} 
                              placeholder="ФИО"
                              onChange={(e) => setEditingTeacher({...t, full_name: e.target.value})}
                            />
                            <Input 
                              defaultValue={t.login} 
                              placeholder="Логин"
                              onChange={(e) => setEditingTeacher({...editingTeacher, login: e.target.value})}
                            />
                            <Input 
                              defaultValue={t.password} 
                              placeholder="Пароль"
                              onChange={(e) => setEditingTeacher({...editingTeacher, password: e.target.value})}
                            />
                            <Button onClick={() => updateUser('teacher', editingTeacher || t)} className="w-full">
                              Сохранить
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedTeacher(t.id)}>
                            <Icon name="Plus" size={14} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Назначить предметы</DialogTitle>
                          </DialogHeader>
                          <Select value={selectedSubject?.toString() || ''} onValueChange={(v) => setSelectedSubject(parseInt(v))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите предмет" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((s: any) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={() => {
                            createEntity('teacher_subject', { teacher_id: selectedTeacher, subject_id: selectedSubject });
                          }}>
                            Назначить
                          </Button>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="destructive" onClick={() => deleteEntity('teacher', t.id)}>
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ученики</CardTitle>
              <CardDescription>Создание и управление учениками</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input placeholder="ФИО" value={newStudent.full_name} onChange={(e) => setNewStudent({...newStudent, full_name: e.target.value})} />
                <Input placeholder="Логин" value={newStudent.login} onChange={(e) => setNewStudent({...newStudent, login: e.target.value})} />
                <Input placeholder="Пароль" type="password" value={newStudent.password} onChange={(e) => setNewStudent({...newStudent, password: e.target.value})} />
                <Select value={newStudent.class_id} onValueChange={(v) => setNewStudent({...newStudent, class_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите класс" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => {
                  createEntity('student', { ...newStudent, class_id: parseInt(newStudent.class_id) || null });
                  setNewStudent({ login: '', password: '', full_name: '', class_id: '' });
                }} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать ученика
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((s: any) => (
                  <div key={s.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                    <div>
                      <div className="font-medium">{s.full_name}</div>
                      <div className="text-sm text-gray-500">Логин: {s.login}</div>
                      <div className="text-sm text-gray-500">Пароль: {s.password}</div>
                      {s.class_name && <Badge variant="secondary" className="mt-1">{s.class_name}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Icon name="Edit" size={14} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Редактировать ученика</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Input 
                              defaultValue={s.full_name} 
                              placeholder="ФИО"
                              onChange={(e) => setEditingStudent({...s, full_name: e.target.value})}
                            />
                            <Input 
                              defaultValue={s.login} 
                              placeholder="Логин"
                              onChange={(e) => setEditingStudent({...editingStudent, login: e.target.value})}
                            />
                            <Input 
                              defaultValue={s.password} 
                              placeholder="Пароль"
                              onChange={(e) => setEditingStudent({...editingStudent, password: e.target.value})}
                            />
                            <Select 
                              defaultValue={s.class_id?.toString()} 
                              onValueChange={(v) => setEditingStudent({...editingStudent, class_id: parseInt(v)})}
                            >
                              <SelectTrigger><SelectValue placeholder="Класс" /></SelectTrigger>
                              <SelectContent>
                                {classes.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Button onClick={() => updateUser('student', editingStudent || {...s, user_id: s.user_id})} className="w-full">
                              Сохранить
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="destructive" onClick={() => deleteEntity('student', s.id)}>
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="classes">
        <Card>
          <CardHeader>
            <CardTitle>Классы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Название класса" value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})} />
              <Input placeholder="Год" type="number" value={newClass.year} onChange={(e) => setNewClass({...newClass, year: parseInt(e.target.value)})} className="w-32" />
              <Button onClick={() => {
                createEntity('class', newClass);
                setNewClass({ name: '', year: 2025 });
              }}>
                Создать
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {classes.map((c: any) => (
                <div key={c.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-gray-500">{c.year} год</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteEntity('class', c.id)}>
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="subjects">
        <Card>
          <CardHeader>
            <CardTitle>Предметы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Название предмета" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              <Button onClick={() => {
                createEntity('subject', { name: newSubject });
                setNewSubject('');
              }}>
                Создать
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              {subjects.map((s: any) => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="font-medium">{s.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => deleteEntity('subject', s.id)}>
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="schedule">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Добавить урок</CardTitle>
              <CardDescription>Создать новый урок в расписании</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Класс</label>
                  <Select value={scheduleForm.class_id} onValueChange={(v) => setScheduleForm({...scheduleForm, class_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Выберите класс" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Предмет</label>
                  <Select value={scheduleForm.subject_id} onValueChange={(v) => setScheduleForm({...scheduleForm, subject_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Выберите предмет" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">День недели</label>
                  <Select value={scheduleForm.day_of_week.toString()} onValueChange={(v) => setScheduleForm({...scheduleForm, day_of_week: parseInt(v)})}>
                    <SelectTrigger><SelectValue placeholder="Выберите день" /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => <SelectItem key={i} value={(i+1).toString()}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Номер урока</label>
                  <Input 
                    type="number" 
                    placeholder="1-8" 
                    min="1"
                    max="8"
                    value={scheduleForm.lesson_number} 
                    onChange={(e) => setScheduleForm({...scheduleForm, lesson_number: parseInt(e.target.value) || 1})} 
                  />
                </div>
                <Button 
                  onClick={() => {
                    createEntity('schedule', {
                      class_id: parseInt(scheduleForm.class_id),
                      subject_id: parseInt(scheduleForm.subject_id),
                      teacher_id: null,
                      day_of_week: scheduleForm.day_of_week,
                      lesson_number: scheduleForm.lesson_number
                    });
                    setScheduleForm({ class_id: '', subject_id: '', teacher_id: '', day_of_week: 1, lesson_number: 1 });
                  }}
                  className="w-full"
                  disabled={!scheduleForm.class_id || !scheduleForm.subject_id}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить урок
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Расписание по классам</CardTitle>
              <CardDescription>Выберите класс для просмотра и редактирования</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedClass?.toString() || ''} onValueChange={(v) => setSelectedClass(parseInt(v))}>
                <SelectTrigger className="mb-4"><SelectValue placeholder="Выберите класс" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              
              {selectedClass ? (
                <ScheduleGrid 
                  classId={selectedClass} 
                  schedule={schedule} 
                  deleteEntity={deleteEntity}
                  loadData={loadData}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Icon name="Calendar" size={64} className="mx-auto mb-3 opacity-30" />
                  <p>Выберите класс для просмотра расписания</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ScheduleGrid({ classId, schedule, deleteEntity, loadData }: any) {
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [editForm, setEditForm] = useState({ lesson_number: '', subject_id: '', teacher_id: '' });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const [subjectsRes, teachersRes] = await Promise.all([
          fetch(`${API_ADMIN}?entity=subjects`, { headers: { 'X-Auth-Token': token || '' } }),
          fetch(`${API_ADMIN}?entity=teachers`, { headers: { 'X-Auth-Token': token || '' } })
        ]);
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          setSubjects(subjectsData.data || subjectsData);
        }
        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          setTeachers(teachersData.data || teachersData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    fetchData();
  }, []);

  const classSchedule = schedule.filter((s: any) => s.class_id === classId);

  const startEdit = (lesson: any) => {
    setEditingLesson(lesson);
    setEditForm({
      lesson_number: lesson.lesson_number.toString(),
      subject_id: lesson.subject_id.toString(),
      teacher_id: lesson.teacher_id.toString()
    });
  };

  const saveEdit = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const res = await fetch(`${API_ADMIN}?entity=schedule&id=${editingLesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
        body: JSON.stringify({
          class_id: editingLesson.class_id,
          day_of_week: editingLesson.day_of_week,
          lesson_number: parseInt(editForm.lesson_number),
          subject_id: parseInt(editForm.subject_id),
          teacher_id: parseInt(editForm.teacher_id)
        })
      });
      if (res.ok) {
        toast.success('Урок обновлён');
        setEditingLesson(null);
        loadData();
      } else {
        toast.error('Ошибка при обновлении');
      }
    } catch (err) {
      toast.error('Ошибка при обновлении');
    }
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {DAYS.map((day, idx) => {
        const dayLessons = classSchedule
          .filter((s: any) => s.day_of_week === idx + 1)
          .sort((a: any, b: any) => a.lesson_number - b.lesson_number);
        
        return (
          <div key={idx} className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <Icon name="Calendar" size={18} className="mr-2 text-primary" />
              {day}
              <Badge variant="outline" className="ml-auto">{dayLessons.length} уроков</Badge>
            </h3>
            {dayLessons.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">Нет уроков</p>
            ) : (
              <div className="space-y-2">
                {dayLessons.map((item: any) => (
                  <div key={item.id} className="p-3 bg-white rounded-lg border hover:border-primary transition">
                    {editingLesson?.id === item.id ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            value={editForm.lesson_number}
                            onChange={(e) => setEditForm({...editForm, lesson_number: e.target.value})}
                            placeholder="№ урока"
                            className="w-24"
                          />
                          <Select value={editForm.subject_id} onValueChange={(v) => setEditForm({...editForm, subject_id: v})}>
                            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {subjects.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Select value={editForm.teacher_id} onValueChange={(v) => setEditForm({...editForm, teacher_id: v})}>
                          <SelectTrigger><SelectValue placeholder="Учитель" /></SelectTrigger>
                          <SelectContent>
                            {teachers.map((t: any) => <SelectItem key={t.id} value={t.id.toString()}>{t.full_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} className="flex-1">
                            <Icon name="Check" size={14} className="mr-1" />
                            Сохранить
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingLesson(null)}>
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">Урок {item.lesson_number}</Badge>
                          </div>
                          <div className="font-medium">{item.subject_name}</div>
                          {item.teacher_name && (
                            <div className="text-xs text-gray-600 mt-1">{item.teacher_name}</div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => startEdit(item)}
                          >
                            <Icon name="Pencil" size={14} className="text-blue-500" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={async () => {
                              await deleteEntity('schedule', item.id);
                              loadData();
                            }}
                          >
                            <Icon name="Trash2" size={14} className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TeacherPanel({ user, classes, subjects, teacherSubjects, gradesData, selectedClass, setSelectedClass, selectedSubject, setSelectedSubject, addGrade, deleteGrade, schedule, homework, loadSchedule, loadHomework, createEntity }: any) {
  const [homeworkForm, setHomeworkForm] = useState({ class_id: '', subject_id: '', description: '', due_date: '' });
  const [editingHomework, setEditingHomework] = useState<any>(null);

  const updateHomework = async (hw: any) => {
    try {
      await fetch(`${API_HOMEWORK}?id=${hw.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: hw.description,
          due_date: hw.due_date
        })
      });
      toast.success('Задание обновлено');
      setEditingHomework(null);
      loadHomework();
    } catch (error) {
      toast.error('Ошибка обновления');
    }
  };

  const deleteHomework = async (homeworkId: number) => {
    try {
      await fetch(`${API_HOMEWORK}?id=${homeworkId}`, {
        method: 'DELETE'
      });
      toast.success('Задание удалено');
      loadHomework();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <Tabs defaultValue="grades" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="grades">
          <Icon name="Award" size={16} className="mr-2" />
          Журнал оценок
        </TabsTrigger>
        <TabsTrigger value="homework">
          <Icon name="BookOpen" size={16} className="mr-2" />
          Домашние задания
        </TabsTrigger>
        <TabsTrigger value="schedule">
          <Icon name="Calendar" size={16} className="mr-2" />
          Расписание
        </TabsTrigger>
      </TabsList>

      <TabsContent value="grades">
        <Card>
          <CardHeader>
            <CardTitle>Журнал оценок</CardTitle>
            <CardDescription>Выставление оценок ученикам</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select value={selectedClass?.toString() || ''} onValueChange={(v) => setSelectedClass(parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Выберите класс" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedSubject?.toString() || ''} onValueChange={(v) => setSelectedSubject(parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Выберите предмет" /></SelectTrigger>
                <SelectContent>
                  {teacherSubjects.map((s: any) => <SelectItem key={s.subject_id} value={s.subject_id.toString()}>{s.subject_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedClass && selectedSubject && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary">
                      <TableHead className="text-primary-foreground">Ученик</TableHead>
                      <TableHead className="text-primary-foreground">Оценки</TableHead>
                      <TableHead className="text-primary-foreground">Средний балл</TableHead>
                      <TableHead className="text-primary-foreground">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradesData.map((student: any) => (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {student.grades.map((g: any, idx: number) => (
                              <Dialog key={idx}>
                                <DialogTrigger asChild>
                                  <div 
                                    className="relative group cursor-pointer"
                                  >
                                    <span 
                                      className={`inline-flex items-center justify-center w-8 h-8 rounded text-sm font-semibold relative ${
                                        g.grade === 5 ? 'bg-green-100 text-green-800' :
                                        g.grade === 4 ? 'bg-blue-100 text-blue-800' :
                                        g.grade === 3 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}
                                      title={`Дата: ${new Date(g.date).toLocaleDateString('ru-RU')}${g.comment ? '\nПримечание: ' + g.comment : ''}`}
                                    >
                                      {g.grade}
                                      {g.comment && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                          <Icon name="MessageCircle" size={8} className="text-white" />
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Оценка {g.grade} - {student.student_name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Дата</Label>
                                      <div className="text-sm text-gray-600">{new Date(g.date).toLocaleDateString('ru-RU')}</div>
                                    </div>
                                    <div>
                                      <Label>Примечание</Label>
                                      <Textarea 
                                        placeholder="Добавьте комментарий к оценке..."
                                        defaultValue={g.comment || ''}
                                        onChange={(e) => setEditingGradeComment({id: g.id, comment: e.target.value})}
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button 
                                        onClick={() => updateGradeComment(editingGradeComment?.id || g.id, editingGradeComment?.comment || g.comment || '')}
                                        className="flex-1"
                                      >
                                        <Icon name="Save" size={16} className="mr-2" />
                                        Сохранить
                                      </Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => deleteGrade(g.id)}
                                      >
                                        <Icon name="Trash2" size={16} className="mr-2" />
                                        Удалить
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-lg font-bold">{student.average ? student.average.toFixed(2) : '-'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {[5, 4, 3, 2].map(grade => (
                              <Button key={grade} size="sm" variant="outline" onClick={() => addGrade(student.student_id, grade)}>
                                {grade}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="homework">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Создать домашнее задание</CardTitle>
              <CardDescription>Добавить новое задание для класса</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Класс</label>
                  <Select value={homeworkForm.class_id} onValueChange={(v) => setHomeworkForm({...homeworkForm, class_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Выберите класс" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Предмет</label>
                  <Select value={homeworkForm.subject_id} onValueChange={(v) => setHomeworkForm({...homeworkForm, subject_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Выберите предмет" /></SelectTrigger>
                    <SelectContent>
                      {teacherSubjects.map((s: any) => <SelectItem key={s.subject_id} value={s.subject_id.toString()}>{s.subject_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Описание задания</label>
                  <Textarea 
                    placeholder="Напишите задание для учеников..."
                    value={homeworkForm.description} 
                    onChange={(e) => setHomeworkForm({...homeworkForm, description: e.target.value})}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Срок сдачи</label>
                  <Input 
                    type="date" 
                    value={homeworkForm.due_date} 
                    onChange={(e) => setHomeworkForm({...homeworkForm, due_date: e.target.value})} 
                  />
                </div>
                <Button 
                  onClick={() => {
                    createEntity('homework', {
                      class_id: parseInt(homeworkForm.class_id),
                      subject_id: parseInt(homeworkForm.subject_id),
                      teacher_id: user.teacher_id,
                      description: homeworkForm.description,
                      due_date: homeworkForm.due_date
                    });
                    setHomeworkForm({ class_id: '', subject_id: '', description: '', due_date: '' });
                    loadHomework();
                  }}
                  className="w-full"
                  disabled={!homeworkForm.class_id || !homeworkForm.subject_id || !homeworkForm.description || !homeworkForm.due_date}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать задание
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Мои домашние задания</CardTitle>
              <CardDescription>Список активных заданий</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {homework.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Icon name="BookOpen" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Пока нет домашних заданий</p>
                  </div>
                ) : (
                  homework.map((hw: any) => (
                    <div key={hw.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                      {editingHomework?.id === hw.id ? (
                        <div className="space-y-3">
                          <Textarea 
                            value={editingHomework.description}
                            onChange={(e) => setEditingHomework({...editingHomework, description: e.target.value})}
                            rows={3}
                          />
                          <Input 
                            type="date"
                            value={editingHomework.due_date}
                            onChange={(e) => setEditingHomework({...editingHomework, due_date: e.target.value})}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateHomework(editingHomework)} className="flex-1">
                              <Icon name="Check" size={14} className="mr-1" />
                              Сохранить
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingHomework(null)} className="flex-1">
                              <Icon name="X" size={14} className="mr-1" />
                              Отмена
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="secondary">{hw.subject_name}</Badge>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditingHomework(hw)}>
                                <Icon name="Edit" size={14} />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteHomework(hw.id)}>
                                <Icon name="Trash2" size={14} className="text-red-500" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{hw.description}</p>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Срок: {new Date(hw.due_date).toLocaleDateString('ru-RU')}</span>
                            <span className={`font-medium ${
                              new Date(hw.due_date) < new Date() ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {new Date(hw.due_date) < new Date() ? 'Просрочено' : 'Активно'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="schedule">
        <Card>
          <CardHeader>
            <CardTitle>Расписание занятий</CardTitle>
            <CardDescription>Просмотр расписания по классам</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedClass?.toString() || ''} onValueChange={(v) => { setSelectedClass(parseInt(v)); loadSchedule(); }}>
              <SelectTrigger><SelectValue placeholder="Выберите класс для просмотра" /></SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            
            {selectedClass ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {DAYS.map((day, idx) => {
                  const dayLessons = schedule.filter((s: any) => s.day_of_week === idx + 1).sort((a: any, b: any) => a.lesson_number - b.lesson_number);
                  return (
                    <div key={idx} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <Icon name="Calendar" size={18} className="mr-2 text-primary" />
                        {day}
                      </h3>
                      {dayLessons.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Нет уроков</p>
                      ) : (
                        <div className="space-y-2">
                          {dayLessons.map((item: any) => (
                            <div key={item.id} className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">Урок {item.lesson_number}</div>
                                  <div className="font-medium text-sm">{item.subject_name}</div>
                                  {item.teacher_name && (
                                    <div className="text-xs text-gray-600 mt-1">{item.teacher_name}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Icon name="Calendar" size={64} className="mx-auto mb-3 opacity-30" />
                <p>Выберите класс для просмотра расписания</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function ClassStatsCard({ classData, loadClassStats }: any) {
  const [stats, setStats] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !stats) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    const data = await loadClassStats(classData.id);
    setStats(data);
  };

  return (
    <div 
      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">{classData.name}</h3>
          <p className="text-sm text-gray-500">{classData.year} год</p>
        </div>
        <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={20} />
      </div>
      
      {isOpen && stats && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.student_count}</div>
            <div className="text-xs text-gray-600">Учеников</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.total_grades}</div>
            <div className="text-xs text-gray-600">Оценок</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.avg_grade.toFixed(2)}</div>
            <div className="text-xs text-gray-600">Средний балл</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentPanel({ user, subjects, schedule, homework, gradesData, selectedSubject, setSelectedSubject }: any) {
  const [myGrades, setMyGrades] = useState<any[]>([]);

  useEffect(() => {
    if (selectedSubject && user?.student_id) {
      loadMyGrades();
    }
  }, [selectedSubject]);

  const loadMyGrades = async () => {
    if (!user?.class_id || !selectedSubject) return;
    
    try {
      const response = await fetch(`${API_GRADES}?class_id=${user.class_id}&subject_id=${selectedSubject}`);
      const data = await response.json();
      const myData = data.data?.find((s: any) => s.student_id === user.student_id);
      setMyGrades(myData ? myData.grades : []);
    } catch (error) {
      console.error('Error loading grades');
    }
  };

  return (
    <Tabs defaultValue="grades" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="grades">
          <Icon name="Award" size={16} className="mr-2" />
          Мои оценки
        </TabsTrigger>
        <TabsTrigger value="homework">
          <Icon name="BookOpen" size={16} className="mr-2" />
          Домашние задания
        </TabsTrigger>
        <TabsTrigger value="schedule">
          <Icon name="Calendar" size={16} className="mr-2" />
          Расписание
        </TabsTrigger>
      </TabsList>

      <TabsContent value="grades">
        <Card>
          <CardHeader>
            <CardTitle>Мои оценки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedSubject?.toString() || ''} onValueChange={(v) => setSelectedSubject(parseInt(v))}>
              <SelectTrigger><SelectValue placeholder="Выберите предмет" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {selectedSubject && (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {myGrades.map((g: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                        g.grade === 5 ? 'bg-green-100 text-green-800' :
                        g.grade === 4 ? 'bg-blue-100 text-blue-800' :
                        g.grade === 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {g.grade}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(g.date).toLocaleDateString('ru-RU')}</span>
                    </div>
                  ))}
                </div>
                {myGrades.length > 0 && (
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-sm text-gray-600">Средний балл</div>
                    <div className="text-3xl font-bold text-primary">
                      {(myGrades.reduce((sum, g) => sum + g.grade, 0) / myGrades.length).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="homework">
        <Card>
          <CardHeader>
            <CardTitle>Домашние задания</CardTitle>
            <CardDescription>Актуальные задания по предметам</CardDescription>
          </CardHeader>
          <CardContent>
            {homework.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Icon name="CheckCircle" size={64} className="mx-auto mb-3 opacity-30 text-green-500" />
                <p>Нет домашних заданий</p>
              </div>
            ) : (
              <div className="space-y-3">
                {homework.map((hw: any) => {
                  const isOverdue = new Date(hw.due_date) < new Date();
                  return (
                    <div key={hw.id} className={`p-4 border rounded-lg ${isOverdue ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={isOverdue ? "destructive" : "secondary"}>{hw.subject_name}</Badge>
                        <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                          до {new Date(hw.due_date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{hw.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          <Icon name="User" size={14} className="inline mr-1" />
                          {hw.teacher_name}
                        </p>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">Просрочено</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="schedule">
        <Card>
          <CardHeader>
            <CardTitle>Моё расписание</CardTitle>
            <CardDescription>Расписание уроков на неделю</CardDescription>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Icon name="Calendar" size={64} className="mx-auto mb-3 opacity-30" />
                <p>Расписание ещё не составлено</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {DAYS.map((day, idx) => {
                  const dayLessons = schedule
                    .filter((s: any) => s.day_of_week === idx + 1)
                    .sort((a: any, b: any) => a.lesson_number - b.lesson_number);
                  return (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <Icon name="Calendar" size={18} className="mr-2 text-primary" />
                        {day}
                        {dayLessons.length > 0 && (
                          <Badge variant="outline" className="ml-auto text-xs">{dayLessons.length}</Badge>
                        )}
                      </h3>
                      {dayLessons.length === 0 ? (
                        <p className="text-sm text-gray-500 italic text-center py-3">Выходной</p>
                      ) : (
                        <div className="space-y-2">
                          {dayLessons.map((item: any) => (
                            <div key={item.id} className="p-3 bg-white rounded-lg border-l-4 border-primary">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">№{item.lesson_number}</Badge>
                              </div>
                              <div className="font-medium text-sm">{item.subject_name}</div>
                              {item.teacher_name && (
                                <div className="text-xs text-gray-600 mt-1">{item.teacher_name}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}