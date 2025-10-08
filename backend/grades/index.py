import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Grades journal - view and add grades for students
    Args: event with httpMethod, queryStringParameters (class_id, subject_id)
    Returns: HTTP response with grades data or success status
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
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'GET':
            class_id = params.get('class_id')
            subject_id = params.get('subject_id')
            
            if not class_id or not subject_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'class_id and subject_id required'})
                }
            
            cur.execute("""
                SELECT s.id, u.full_name
                FROM students s
                JOIN users u ON s.user_id = u.id
                WHERE s.class_id = %s
                ORDER BY u.full_name
            """, (class_id,))
            students = cur.fetchall()
            
            result = []
            for student in students:
                student_id = student[0]
                student_name = student[1]
                
                cur.execute("""
                    SELECT id, grade, grade_date, comment
                    FROM grades
                    WHERE student_id = %s AND subject_id = %s
                    ORDER BY grade_date
                """, (student_id, subject_id))
                grades_rows = cur.fetchall()
                
                grades = [{'id': g[0], 'grade': g[1], 'date': str(g[2]), 'comment': g[3]} for g in grades_rows]
                
                avg_grade = 0
                if grades:
                    avg_grade = round(sum(g['grade'] for g in grades) / len(grades), 2)
                
                result.append({
                    'student_id': student_id,
                    'student_name': student_name,
                    'grades': grades,
                    'average': avg_grade
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'data': result})
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            student_id = body_data.get('student_id')
            subject_id = body_data.get('subject_id')
            grade = body_data.get('grade')
            grade_date = body_data.get('grade_date')
            comment = body_data.get('comment', '')
            teacher_id = body_data.get('teacher_id')
            
            cur.execute("""
                INSERT INTO grades (student_id, subject_id, teacher_id, grade, grade_date, comment)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (student_id, subject_id, teacher_id, grade, grade_date, comment))
            
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
        
        elif method == 'PUT':
            grade_id = params.get('id')
            body_data = json.loads(event.get('body', '{}'))
            comment = body_data.get('comment', '')
            
            if not grade_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'grade id required'})
                }
            
            cur.execute("UPDATE grades SET comment = %s WHERE id = %s", (comment, grade_id))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        elif method == 'DELETE':
            grade_id = params.get('id')
            
            if not grade_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'grade id required'})
                }
            
            cur.execute("DELETE FROM grades WHERE id = %s", (grade_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
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