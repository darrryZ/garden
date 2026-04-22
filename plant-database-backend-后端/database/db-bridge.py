#!/usr/bin/env python3
"""
数据库桥接脚本
供 Node.js 调用，执行 SQLite 数据库操作
"""

import sys
import json
import os

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import GardenDatabase

# 数据库文件路径
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'garden.db')
db = GardenDatabase(DB_PATH)


def handle_request(data):
    """处理请求"""
    method = data.get('method')
    params = data.get('params', {})
    
    try:
        # ==================== 用户管理 ====================
        if method == 'register':
            user = db.create_user(
                username=params['username'],
                email=params['email'],
                password=params['password']
            )
            return {'success': True, 'data': user}
        
        elif method == 'login':
            user = db.verify_password(params['email'], params['password'])
            if user:
                session = db.create_session(
                    user_id=user['id'],
                    ip_address=params.get('ip_address'),
                    user_agent=params.get('user_agent')
                )
                return {'success': True, 'data': {'user': user, 'session_token': session}}
            return {'success': False, 'error': '邮箱或密码错误'}
        
        elif method == 'validate_session':
            session = db.validate_session(params['session_token'])
            return {'success': True, 'data': session}
        
        elif method == 'logout':
            db.delete_session(params['session_token'])
            return {'success': True}
        
        elif method == 'get_user_by_id':
            user = db.get_user_by_id(params['user_id'])
            return {'success': True, 'data': user}
        
        # ==================== 花园管理 ====================
        elif method == 'create_garden':
            garden = db.create_garden(
                user_id=params['user_id'],
                name=params['name'],
                description=params.get('description'),
                location=params.get('location'),
                size_sqm=params.get('size_sqm')
            )
            return {'success': True, 'data': garden}
        
        elif method == 'get_user_gardens':
            gardens = db.get_user_gardens(params['user_id'])
            return {'success': True, 'data': gardens}
        
        elif method == 'get_garden_by_id':
            garden = db.get_garden_by_id(params['garden_id'])
            return {'success': True, 'data': garden}
        
        elif method == 'update_garden':
            success = db.update_garden(
                garden_id=params['garden_id'],
                name=params.get('name'),
                description=params.get('description'),
                location=params.get('location'),
                size_sqm=params.get('size_sqm')
            )
            return {'success': success}
        
        elif method == 'delete_garden':
            success = db.delete_garden(params['garden_id'])
            return {'success': success}
        
        # ==================== 植物类型 ====================
        elif method == 'get_all_plant_types':
            types = db.get_all_plant_types(params.get('category'))
            return {'success': True, 'data': types}
        
        elif method == 'get_plant_type_by_id':
            pt = db.get_plant_type_by_id(params['plant_type_id'])
            return {'success': True, 'data': pt}
        
        # ==================== 用户植物 ====================
        elif method == 'add_plant':
            plant = db.add_plant_to_garden(
                user_id=params['user_id'],
                garden_id=params.get('garden_id'),
                plant_type_id=params.get('plant_type_id'),
                custom_name=params.get('custom_name'),
                planted_at=params.get('planted_at'),
                position_x=params.get('position_x'),
                position_y=params.get('position_y'),
                notes=params.get('notes')
            )
            return {'success': True, 'data': plant}
        
        elif method == 'get_user_plants':
            plants = db.get_user_plants(
                user_id=params['user_id'],
                garden_id=params.get('garden_id'),
                status=params.get('status')
            )
            return {'success': True, 'data': plants}
        
        elif method == 'get_plant_by_id':
            plant = db.get_plant_by_id(params['plant_id'])
            return {'success': True, 'data': plant}
        
        elif method == 'update_plant':
            success = db.update_plant(
                plant_id=params['plant_id'],
                custom_name=params.get('custom_name'),
                status=params.get('status'),
                notes=params.get('notes'),
                garden_id=params.get('garden_id')
            )
            return {'success': success}
        
        elif method == 'delete_plant':
            success = db.delete_plant(params['plant_id'])
            return {'success': success}
        
        elif method == 'water_plant':
            log = db.add_care_log(
                plant_id=params['plant_id'],
                user_id=params['user_id'],
                action_type='water',
                action_details=params.get('notes', '浇水')
            )
            return {'success': True, 'data': log}
        
        elif method == 'fertilize_plant':
            log = db.add_care_log(
                plant_id=params['plant_id'],
                user_id=params['user_id'],
                action_type='fertilize',
                action_details=params.get('notes', '施肥')
            )
            return {'success': True, 'data': log}
        
        elif method == 'add_plant_care_log':
            log = db.add_care_log(
                plant_id=params['plant_id'],
                user_id=params['user_id'],
                action_type=params.get('action_type', 'other'),
                action_details=params.get('action_details', ''),
                photo_url=params.get('photo_url')
            )
            return {'success': True, 'data': log}
        
        elif method == 'get_plant_care_logs':
            logs = db.get_plant_care_logs(
                plant_id=params['plant_id'],
                limit=params.get('limit', 50)
            )
            return {'success': True, 'data': logs}
        
        elif method == 'get_plants_needing_care':
            plants = db.get_plants_needing_care(
                user_id=params['user_id'],
                days=params.get('days', 7)
            )
            return {'success': True, 'data': plants}
        
        elif method == 'get_user_stats':
            stats = db.get_user_stats(params['user_id'])
            return {'success': True, 'data': stats}
        
        else:
            return {'success': False, 'error': f'未知方法: {method}'}
    
    except Exception as e:
        return {'success': False, 'error': str(e)}


if __name__ == '__main__':
    # 支持两种模式：命令行参数模式（旧）和持久化模式（新）
    if len(sys.argv) > 1:
        # 命令行参数模式（旧模式，单次执行）
        try:
            request_data = json.loads(sys.argv[1])
            result = handle_request(request_data)
            print(json.dumps(result, ensure_ascii=False))
        except json.JSONDecodeError as e:
            print(json.dumps({'success': False, 'error': f'JSON解析错误: {str(e)}'}))
        except Exception as e:
            print(json.dumps({'success': False, 'error': str(e)}))
    else:
        # 持久化模式（新模式，持续运行）
        # 从 stdin 读取请求，每行一个 JSON
        print(json.dumps({'status': 'ready', 'message': '数据库桥接已启动'}), flush=True)
        
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            
            try:
                request_data = json.loads(line)
                request_id = request_data.get('id', 0)
                result = handle_request(request_data)
                
                # 返回带 ID 的响应
                response = {
                    'id': request_id,
                    'result': result
                }
                print(json.dumps(response, ensure_ascii=False), flush=True)
                
            except json.JSONDecodeError as e:
                response = {
                    'id': 0,
                    'error': f'JSON解析错误: {str(e)}'
                }
                print(json.dumps(response, ensure_ascii=False), flush=True)
            except Exception as e:
                response = {
                    'id': 0,
                    'error': str(e)
                }
                print(json.dumps(response, ensure_ascii=False), flush=True)
