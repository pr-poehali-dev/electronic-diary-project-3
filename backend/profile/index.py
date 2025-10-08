import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User profile customization - update avatar color and emoji
    Args: event with httpMethod, body (user_id, avatar_color, avatar_emoji)
    Returns: HTTP response with success status
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
    user_id = body_data.get('user_id')
    avatar_color = body_data.get('avatar_color')
    avatar_emoji = body_data.get('avatar_emoji')
    
    dsn = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if avatar_color and avatar_emoji:
            cur.execute(
                "UPDATE users SET avatar_color = %s, avatar_emoji = %s WHERE id = %s",
                (avatar_color, avatar_emoji, user_id)
            )
        elif avatar_color:
            cur.execute(
                "UPDATE users SET avatar_color = %s WHERE id = %s",
                (avatar_color, user_id)
            )
        elif avatar_emoji:
            cur.execute(
                "UPDATE users SET avatar_emoji = %s WHERE id = %s",
                (avatar_emoji, user_id)
            )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'success': True})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }
