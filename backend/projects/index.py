import json
import os
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def dict_to_json_safe(data):
    return json.loads(json.dumps(data, default=serialize_datetime))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage projects and files (CRUD operations)
    Args: event with httpMethod (GET/POST/PUT), body with project data
    Returns: Project data or success status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            project_id = query_params.get('id')
            
            if project_id:
                cur.execute(
                    "SELECT * FROM projects WHERE id = %s",
                    (project_id,)
                )
                project = cur.fetchone()
                
                if not project:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Project not found'})
                    }
                
                cur.execute(
                    "SELECT * FROM project_files WHERE project_id = %s",
                    (project_id,)
                )
                files = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'project': dict_to_json_safe(dict(project)),
                        'files': [dict_to_json_safe(dict(f)) for f in files]
                    })
                }
            else:
                cur.execute("SELECT * FROM projects ORDER BY updated_at DESC LIMIT 50")
                projects = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'projects': [dict_to_json_safe(dict(p)) for p in projects]
                    })
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name')
            description = body_data.get('description', '')
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Project name required'})
                }
            
            cur.execute(
                "INSERT INTO projects (name, description) VALUES (%s, %s) RETURNING *",
                (name, description)
            )
            project = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'project': dict_to_json_safe(dict(project)),
                    'message': 'Project created'
                })
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            project_id = body_data.get('id')
            file_path = body_data.get('file_path')
            content = body_data.get('content')
            language = body_data.get('language', 'javascript')
            
            if not project_id or not file_path:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Project ID and file_path required'})
                }
            
            cur.execute(
                '''INSERT INTO project_files (project_id, file_path, content, language, updated_at)
                   VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                   ON CONFLICT (project_id, file_path) 
                   DO UPDATE SET content = EXCLUDED.content, 
                                 language = EXCLUDED.language,
                                 updated_at = CURRENT_TIMESTAMP
                   RETURNING *''',
                (project_id, file_path, content, language)
            )
            file_data = cur.fetchone()
            
            cur.execute(
                "UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (project_id,)
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'file': dict_to_json_safe(dict(file_data)),
                    'message': 'File saved'
                })
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }
            
    except Exception as e:
        if conn:
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if conn:
            conn.close()