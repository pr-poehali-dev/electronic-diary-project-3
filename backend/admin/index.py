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
                    SELECT t.id, u.full_name, u.login 
                    FROM teachers t 
                    JOIN users u ON t.user_id = u.id 
                    ORDER BY u.full_name
                """)
                rows = cur.fetchall()
                data = [{'id': r[0], 'full_name': r[1], 'login': r[2]} for r in rows]
                
            elif entity == 'students':
                cur.execute("""
                    SELECT s.id, u.full_name, u.login, c.name as class_name, s.class_id
                    FROM students s 
                    JOIN users u ON s.user_id = u.id 
                    LEFT JOIN classes c ON s.class_id = c.id
                    ORDER BY u.full_name
                """)
                rows = cur.fetchall()
                data = [{'id': r[0], 'full_name': r[1], 'login': r[2], 'class_name': r[3], 'class_id': r[4]} for r in rows]
                
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
