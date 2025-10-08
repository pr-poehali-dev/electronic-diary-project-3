import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Admin panel CRUD operations for classes, teachers, students, subjects
    Args: event with httpMethod, queryStringParameters (action, entity)
    Returns: HTTP response with data or success status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')
    entity = params.get('entity', '')
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'GET':
            if entity == 'classes':
                cur.execute("SELECT id, name, year FROM classes ORDER BY name")
                rows = cur.fetchall()
                data = [{'id': r[0], 'name': r[1], 'year': r[2]} for r in rows]
                
            elif entity == 'subjects':
                cur.execute("SELECT id, name FROM subjects ORDER BY name")
                rows = cur.fetchall()
                data = [{'id': r[0], 'name': r[1]} for r in rows]
                
            elif entity == 'teachers':
                cur.execute("""
                    SELECT t.id, u.full_name, u.login, u.password, t.user_id
                    FROM teachers t 
                    JOIN users u ON t.user_id = u.id 
                    ORDER BY u.full_name
                """)
                rows = cur.fetchall()
                data = [{'id': r[0], 'full_name': r[1], 'login': r[2], 'password': r[3], 'user_id': r[4]} for r in rows]
                
            elif entity == 'students':
                cur.execute("""
                    SELECT s.id, u.full_name, u.login, u.password, c.name as class_name, s.class_id
                    FROM students s 
                    JOIN users u ON s.user_id = u.id 
                    LEFT JOIN classes c ON s.class_id = c.id
                    ORDER BY u.full_name
                """)
                rows = cur.fetchall()
                data = [{'id': r[0], 'full_name': r[1], 'login': r[2], 'password': r[3], 'class_name': r[4], 'class_id': r[5]} for r in rows]
                
            elif entity == 'teacher_subjects':
                teacher_id = params.get('teacher_id')
                if teacher_id:
                    cur.execute("""
                        SELECT ts.id, s.id as subject_id, s.name as subject_name
                        FROM teacher_subjects ts
                        JOIN subjects s ON ts.subject_id = s.id
                        WHERE ts.teacher_id = %s
                    """, (teacher_id,))
                    rows = cur.fetchall()
                    data = [{'id': r[0], 'subject_id': r[1], 'subject_name': r[2]} for r in rows]
                else:
                    data = []
            
            elif entity == 'schedule':
                class_id = params.get('class_id')
                if class_id:
                    cur.execute("""
                        SELECT s.id, s.day_of_week, s.lesson_number, 
                               sub.name as subject_name, u.full_name as teacher_name
                        FROM schedule s
                        JOIN subjects sub ON s.subject_id = sub.id
                        LEFT JOIN teachers t ON s.teacher_id = t.id
                        LEFT JOIN users u ON t.user_id = u.id
                        WHERE s.class_id = %s
                        ORDER BY s.day_of_week, s.lesson_number
                    """, (class_id,))
                    rows = cur.fetchall()
                    data = [{'id': r[0], 'day_of_week': r[1], 'lesson_number': r[2], 'subject_name': r[3], 'teacher_name': r[4]} for r in rows]
                else:
                    cur.execute("""
                        SELECT s.id, s.day_of_week, s.lesson_number, 
                               c.name as class_name, sub.name as subject_name, 
                               u.full_name as teacher_name, s.class_id
                        FROM schedule s
                        JOIN classes c ON s.class_id = c.id
                        JOIN subjects sub ON s.subject_id = sub.id
                        LEFT JOIN teachers t ON s.teacher_id = t.id
                        LEFT JOIN users u ON t.user_id = u.id
                        ORDER BY c.name, s.day_of_week, s.lesson_number
                    """)
                    rows = cur.fetchall()
                    data = [{'id': r[0], 'day_of_week': r[1], 'lesson_number': r[2], 'class_name': r[3], 'subject_name': r[4], 'teacher_name': r[5], 'class_id': r[6]} for r in rows]
            
            elif entity == 'homework':
                class_id = params.get('class_id')
                if class_id:
                    cur.execute("""
                        SELECT h.id, h.description, h.due_date, 
                               sub.name as subject_name, u.full_name as teacher_name
                        FROM homework h
                        JOIN subjects sub ON h.subject_id = sub.id
                        LEFT JOIN teachers t ON h.teacher_id = t.id
                        LEFT JOIN users u ON t.user_id = u.id
                        WHERE h.class_id = %s
                        ORDER BY h.due_date DESC
                    """, (class_id,))
                    rows = cur.fetchall()
                    data = [{'id': r[0], 'description': r[1], 'due_date': str(r[2]), 'subject_name': r[3], 'teacher_name': r[4]} for r in rows]
                else:
                    cur.execute("""
                        SELECT h.id, h.description, h.due_date, 
                               c.name as class_name, sub.name as subject_name, 
                               u.full_name as teacher_name, h.class_id
                        FROM homework h
                        JOIN classes c ON h.class_id = c.id
                        JOIN subjects sub ON h.subject_id = sub.id
                        LEFT JOIN teachers t ON h.teacher_id = t.id
                        LEFT JOIN users u ON t.user_id = u.id
                        ORDER BY h.due_date DESC
                    """)
                    rows = cur.fetchall()
                    data = [{'id': r[0], 'description': r[1], 'due_date': str(r[2]), 'class_name': r[3], 'subject_name': r[4], 'teacher_name': r[5], 'class_id': r[6]} for r in rows]
            
            elif entity == 'stats':
                class_id = params.get('class_id')
                
                if class_id:
                    cur.execute("""
                        SELECT 
                            COUNT(DISTINCT s.id) as student_count,
                            COUNT(DISTINCT g.id) as total_grades,
                            COALESCE(AVG(g.grade), 0) as avg_grade
                        FROM students s
                        LEFT JOIN grades g ON s.id = g.student_id
                        WHERE s.class_id = %s
                    """, (class_id,))
                    row = cur.fetchone()
                    data = {'student_count': row[0], 'total_grades': row[1], 'avg_grade': float(row[2])}
                else:
                    cur.execute("""
                        SELECT 
                            (SELECT COUNT(*) FROM students) as total_students,
                            (SELECT COUNT(*) FROM teachers) as total_teachers,
                            (SELECT COUNT(*) FROM classes) as total_classes,
                            (SELECT COUNT(*) FROM subjects) as total_subjects,
                            COALESCE(AVG(grade), 0) as overall_avg
                        FROM grades
                    """)
                    row = cur.fetchone()
                    data = {
                        'total_students': row[0],
                        'total_teachers': row[1],
                        'total_classes': row[2],
                        'total_subjects': row[3],
                        'overall_avg': float(row[4])
                    }
                
            else:
                data = []
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'data': data})
            }
        
        elif method == 'DELETE':
            entity_id = params.get('id')
            
            if entity == 'class':
                cur.execute("DELETE FROM classes WHERE id = %s", (entity_id,))
            elif entity == 'subject':
                cur.execute("DELETE FROM subjects WHERE id = %s", (entity_id,))
            elif entity == 'teacher':
                cur.execute("SELECT user_id FROM teachers WHERE id = %s", (entity_id,))
                user_row = cur.fetchone()
                if user_row:
                    cur.execute("DELETE FROM teachers WHERE id = %s", (entity_id,))
                    cur.execute("DELETE FROM users WHERE id = %s", (user_row[0],))
            elif entity == 'student':
                cur.execute("SELECT user_id FROM students WHERE id = %s", (entity_id,))
                user_row = cur.fetchone()
                if user_row:
                    cur.execute("DELETE FROM students WHERE id = %s", (entity_id,))
                    cur.execute("DELETE FROM users WHERE id = %s", (user_row[0],))
            elif entity == 'schedule':
                cur.execute("DELETE FROM schedule WHERE id = %s", (entity_id,))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            entity_id = params.get('id')
            
            if entity == 'teacher':
                user_id = body_data.get('user_id')
                full_name = body_data.get('full_name')
                login = body_data.get('login')
                password = body_data.get('password')
                
                cur.execute("""
                    UPDATE users 
                    SET full_name = %s, login = %s, password = %s
                    WHERE id = %s
                """, (full_name, login, password, user_id))
                conn.commit()
                result = {'success': True}
            
            elif entity == 'student':
                user_id = body_data.get('user_id')
                full_name = body_data.get('full_name')
                login = body_data.get('login')
                password = body_data.get('password')
                class_id = body_data.get('class_id')
                
                cur.execute("""
                    UPDATE users 
                    SET full_name = %s, login = %s, password = %s
                    WHERE id = %s
                """, (full_name, login, password, user_id))
                
                cur.execute("""
                    UPDATE students 
                    SET class_id = %s
                    WHERE user_id = %s
                """, (class_id, user_id))
                
                conn.commit()
                result = {'success': True}
            
            else:
                result = {'success': False, 'error': 'Unknown entity'}
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(result)
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            if entity == 'class':
                name = body_data.get('name', '')
                year = body_data.get('year', 2025)
                cur.execute("INSERT INTO classes (name, year) VALUES (%s, %s) RETURNING id", (name, year))
                new_id = cur.fetchone()[0]
                conn.commit()
                result = {'success': True, 'id': new_id}
                
            elif entity == 'subject':
                name = body_data.get('name', '')
                cur.execute("INSERT INTO subjects (name) VALUES (%s) RETURNING id", (name,))
                new_id = cur.fetchone()[0]
                conn.commit()
                result = {'success': True, 'id': new_id}
                
            elif entity == 'teacher':
                login = body_data.get('login', '')
                password = body_data.get('password', '')
                full_name = body_data.get('full_name', '')
                
                cur.execute("INSERT INTO users (login, password, role, full_name) VALUES (%s, %s, 'teacher', %s) RETURNING id", (login, password, full_name))
                user_id = cur.fetchone()[0]
                cur.execute("INSERT INTO teachers (user_id) VALUES (%s) RETURNING id", (user_id,))
                teacher_id = cur.fetchone()[0]
                conn.commit()
                result = {'success': True, 'id': teacher_id}
                
            elif entity == 'student':
                login = body_data.get('login', '')
                password = body_data.get('password', '')
                full_name = body_data.get('full_name', '')
                class_id = body_data.get('class_id')
                
                cur.execute("INSERT INTO users (login, password, role, full_name) VALUES (%s, %s, 'student', %s) RETURNING id", (login, password, full_name))
                user_id = cur.fetchone()[0]
                cur.execute("INSERT INTO students (user_id, class_id) VALUES (%s, %s) RETURNING id", (user_id, class_id))
                student_id = cur.fetchone()[0]
                conn.commit()
                result = {'success': True, 'id': student_id}
            
            elif entity == 'teacher_class':
                teacher_id = body_data.get('teacher_id')
                class_id = body_data.get('class_id')
                subject_id = body_data.get('subject_id')
                
                cur.execute("INSERT INTO teacher_classes (teacher_id, class_id, subject_id) VALUES (%s, %s, %s) RETURNING id", (teacher_id, class_id, subject_id))
                new_id = cur.fetchone()[0]
                conn.commit()
                result = {'success': True, 'id': new_id}
            
            elif entity == 'teacher_subject':
                teacher_id = body_data.get('teacher_id')
                subject_id = body_data.get('subject_id')
                
                cur.execute("INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (%s, %s) RETURNING id", (teacher_id, subject_id))
                new_id = cur.fetchone()[0]
                conn.commit()
                result = {'success': True, 'id': new_id}
            
            elif entity == 'schedule':
                class_id = body_data.get('class_id')
                subject_id = body_data.get('subject_id')
                teacher_id = body_data.get('teacher_id')
                day_of_week = body_data.get('day_of_week')
                lesson_number = body_data.get('lesson_number')
                
                cur.execute("""
                    INSERT INTO schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (class_id, subject_id, teacher_id, day_of_week, lesson_number))
                new_id = cur.fetchone()[0]
                conn.commit()
                result = {'success': True, 'id': new_id}
            
            elif entity == 'homework':
                class_id = body_data.get('class_id')
                subject_id = body_data.get('subject_id')
                teacher_id = body_data.get('teacher_id')
                description = body_data.get('description', '')
                due_date = body_data.get('due_date')
                
                cur.execute("""
                    INSERT INTO homework (class_id, subject_id, teacher_id, description, due_date)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (class_id, subject_id, teacher_id, description, due_date))
                new_id = cur.fetchone()[0]
                conn.commit()
                result = {'success': True, 'id': new_id}
            
            else:
                result = {'success': False, 'error': 'Unknown entity'}
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(result)
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }