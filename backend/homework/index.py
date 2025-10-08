import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Homework management - create, view homework assignments
    Args: event with httpMethod, queryStringParameters, body
    Returns: HTTP response with homework data or success status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    params = event.get('queryStringParameters', {}) or {}
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'GET':
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
            
            if class_id:
                data = [{
                    'id': r[0],
                    'description': r[1],
                    'due_date': str(r[2]),
                    'subject_name': r[3],
                    'teacher_name': r[4]
                } for r in rows]
            else:
                data = [{
                    'id': r[0],
                    'description': r[1],
                    'due_date': str(r[2]),
                    'class_name': r[3],
                    'subject_name': r[4],
                    'teacher_name': r[5],
                    'class_id': r[6]
                } for r in rows]
            
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
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True, 'id': new_id})
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
