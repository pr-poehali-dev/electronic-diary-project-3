import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication endpoint
    Args: event with httpMethod, body (login, password)
    Returns: HTTP response with user data or error
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    login = body_data.get('login', '')
    password = body_data.get('password', '')
    
    if not login or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Login and password required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        login_escaped = login.replace("'", "''")
        password_escaped = password.replace("'", "''")
        
        cur.execute(f"SELECT id, login, role, full_name, avatar_color, avatar_emoji FROM users WHERE login = '{login_escaped}' AND password = '{password_escaped}'")
        user = cur.fetchone()
        
        if user:
            user_id = user[0]
            role = user[2]
            
            if role == 'teacher':
                cur.execute(f"SELECT id FROM teachers WHERE user_id = {user_id}")
                teacher_row = cur.fetchone()
                teacher_id = teacher_row[0] if teacher_row else None
            elif role == 'student':
                cur.execute(f"SELECT id, class_id FROM students WHERE user_id = {user_id}")
                student_row = cur.fetchone()
                student_id = student_row[0] if student_row else None
                class_id = student_row[1] if student_row else None
            else:
                teacher_id = None
                student_id = None
                class_id = None
            
            cur.close()
            conn.close()
            
            user_data = {
                'id': user[0],
                'login': user[1],
                'role': user[2],
                'full_name': user[3],
                'avatar_color': user[4],
                'avatar_emoji': user[5],
                'teacher_id': teacher_id if role == 'teacher' else None,
                'student_id': student_id if role == 'student' else None,
                'class_id': class_id if role == 'student' else None
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True, 'user': user_data})
            }
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': False, 'error': 'Invalid credentials'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }