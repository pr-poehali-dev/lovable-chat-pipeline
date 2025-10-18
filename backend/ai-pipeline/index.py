import json
import os
import re
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def extract_code_blocks(text: str) -> List[Dict[str, str]]:
    '''Extract code blocks from AI response'''
    pattern = r'```(\w+)?\n(.*?)```'
    matches = re.findall(pattern, text, re.DOTALL)
    
    blocks = []
    for lang, code in matches:
        blocks.append({
            'language': lang or 'javascript',
            'code': code.strip()
        })
    return blocks

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: AI pipeline with project context and automatic code application
    Args: event with httpMethod, body containing project_id, messages, current_file
    Returns: AI response with code suggestions and applied changes
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
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    conn = None
    try:
        body_data = json.loads(event.get('body', '{}'))
        project_id = body_data.get('project_id')
        messages = body_data.get('messages', [])
        current_file = body_data.get('current_file', '')
        current_code = body_data.get('current_code', '')
        
        if not messages:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Messages required'})
            }
        
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'OpenAI API key not configured'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        context_info = ''
        if project_id:
            cur.execute(
                "SELECT file_path, content, language FROM project_files WHERE project_id = %s LIMIT 10",
                (project_id,)
            )
            files = cur.fetchall()
            
            if files:
                context_info = '\n\nКонтекст проекта:\n'
                for f in files:
                    context_info += f"Файл: {f['file_path']} ({f['language']})\n"
        
        if current_file and current_code:
            context_info += f"\n\nТекущий файл: {current_file}\nКод:\n```\n{current_code}\n```"
        
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        system_prompt = f'''Ты опытный программист-ассистент для платформы разработки. 
Помогаешь писать код, исправлять ошибки и объясняешь концепции.

ВАЖНО: Когда генерируешь код, ВСЕГДА оборачивай его в блоки ```language и включай ПОЛНЫЙ рабочий код файла.

Пример правильного ответа:
"Вот исправленный компонент:
```jsx
import React from 'react';

function MyComponent() {{
  return <div>Hello World</div>;
}}

export default MyComponent;
```
"

Отвечай кратко и по делу на русском языке.{context_info}'''
        
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': system_prompt},
                *messages
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        ai_message = response.choices[0].message.content
        code_blocks = extract_code_blocks(ai_message)
        
        session_id = None
        if project_id and conn:
            cur.execute(
                "INSERT INTO chat_sessions (project_id) VALUES (%s) RETURNING id",
                (project_id,)
            )
            session_result = cur.fetchone()
            if session_result:
                session_id = session_result['id']
                
                for msg in messages:
                    cur.execute(
                        "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
                        (session_id, msg.get('role'), msg.get('content'))
                    )
                
                code_changes_json = json.dumps(code_blocks) if code_blocks else None
                cur.execute(
                    "INSERT INTO chat_messages (session_id, role, content, code_changes) VALUES (%s, %s, %s, %s)",
                    (session_id, 'assistant', ai_message, code_changes_json)
                )
                
                conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': ai_message,
                'code_blocks': code_blocks,
                'session_id': session_id,
                'has_code': len(code_blocks) > 0
            })
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
