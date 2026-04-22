"""
花园应用 API 接口层
可以与 Flask/FastAPI/Django 等框架集成
"""

from database import GardenDatabase, db
from typing import Dict, Any, Optional, List
import json


class GardenAPI:
    """花园应用 API 接口"""
    
    def __init__(self, database: GardenDatabase = None):
        self.db = database or db
    
    # ========== 认证相关 ==========
    
    def register(self, username: str, email: str, password: str, 
                 display_name: str = None) -> Dict[str, Any]:
        """用户注册"""
        try:
            user = self.db.create_user(username, email, password, display_name)
            return {'success': True, 'data': user}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def login(self, email: str, password: str, ip_address: str = None, 
              user_agent: str = None) -> Dict[str, Any]:
        """用户登录"""
        user = self.db.verify_password(email, password)
        if not user:
            return {'success': False, 'error': '邮箱或密码错误'}
        
        # 创建会话
        session_token = self.db.create_session(
            user['id'], 
            expires_days=30,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return {
            'success': True,
            'data': {
                'user': user,
                'session_token': session_token
            }
        }
    
    def logout(self, session_token: str) -> Dict[str, Any]:
        """用户登出"""
        self.db.delete_session(session_token)
        return {'success': True}
    
    def get_current_user(self, session_token: str) -> Optional[Dict[str, Any]]:
        """获取当前登录用户"""
        session = self.db.validate_session(session_token)
        if session:
            return self.db.get_user_by_id(session['user_id'])
        return None
    
    def require_auth(self, session_token: str) -> Dict[str, Any]:
        """验证用户是否已登录"""
        session = self.db.validate_session(session_token)
        if not session:
            return {'success': False, 'error': '未登录或会话已过期'}
        return {'success': True, 'user_id': session['user_id']}
    
    # ========== 用户管理 ==========
    
    def update_profile(self, user_id: int, **kwargs) -> Dict[str, Any]:
        """更新用户资料"""
        user = self.db.update_user(user_id, **kwargs)
        if user:
            return {'success': True, 'data': user}
        return {'success': False, 'error': '更新失败'}
    
    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        """修改密码"""
        # 这里需要验证旧密码，但当前数据库接口没有提供
        # 实际使用时需要先验证旧密码
        success = self.db.change_password(user_id, new_password)
        return {'success': success}
    
    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """获取用户统计"""
        stats = self.db.get_user_stats(user_id)
        return {'success': True, 'data': stats}
    
    # ========== 花园管理 ==========
    
    def create_garden(self, user_id: int, name: str, **kwargs) -> Dict[str, Any]:
        """创建花园"""
        garden = self.db.create_garden(user_id, name, **kwargs)
        return {'success': True, 'data': garden}
    
    def get_gardens(self, user_id: int) -> Dict[str, Any]:
        """获取用户的所有花园"""
        gardens = self.db.get_user_gardens(user_id)
        return {'success': True, 'data': gardens}
    
    def get_garden(self, garden_id: int) -> Dict[str, Any]:
        """获取花园详情"""
        garden = self.db.get_garden_by_id(garden_id)
        if garden:
            return {'success': True, 'data': garden}
        return {'success': False, 'error': '花园不存在'}
    
    def update_garden(self, garden_id: int, **kwargs) -> Dict[str, Any]:
        """更新花园"""
        garden = self.db.update_garden(garden_id, **kwargs)
        if garden:
            return {'success': True, 'data': garden}
        return {'success': False, 'error': '更新失败'}
    
    def delete_garden(self, garden_id: int) -> Dict[str, Any]:
        """删除花园"""
        success = self.db.delete_garden(garden_id)
        return {'success': success}
    
    # ========== 植物管理 ==========
    
    def add_plant(self, user_id: int, garden_id: int = None, **kwargs) -> Dict[str, Any]:
        """添加植物"""
        plant = self.db.add_plant_to_garden(user_id, garden_id, **kwargs)
        return {'success': True, 'data': plant}
    
    def get_plants(self, user_id: int, garden_id: int = None, status: str = None) -> Dict[str, Any]:
        """获取植物列表"""
        plants = self.db.get_user_plants(user_id, garden_id, status)
        return {'success': True, 'data': plants}
    
    def get_plant(self, plant_id: int) -> Dict[str, Any]:
        """获取植物详情"""
        plant = self.db.get_plant_by_id(plant_id)
        if plant:
            return {'success': True, 'data': plant}
        return {'success': False, 'error': '植物不存在'}
    
    def update_plant(self, plant_id: int, **kwargs) -> Dict[str, Any]:
        """更新植物"""
        plant = self.db.update_plant(plant_id, **kwargs)
        if plant:
            return {'success': True, 'data': plant}
        return {'success': False, 'error': '更新失败'}
    
    def delete_plant(self, plant_id: int) -> Dict[str, Any]:
        """删除植物"""
        success = self.db.delete_plant(plant_id)
        return {'success': success}
    
    def get_plants_needing_care(self, user_id: int, days: int = 3) -> Dict[str, Any]:
        """获取需要照料的植物"""
        plants = self.db.get_plants_needing_care(user_id, days)
        return {'success': True, 'data': plants}
    
    # ========== 植物类型 ==========
    
    def get_plant_types(self, category: str = None) -> Dict[str, Any]:
        """获取植物类型列表"""
        types = self.db.get_all_plant_types(category)
        return {'success': True, 'data': types}
    
    def create_plant_type(self, **kwargs) -> Dict[str, Any]:
        """创建植物类型（管理员功能）"""
        plant_type = self.db.create_plant_type(**kwargs)
        return {'success': True, 'data': plant_type}
    
    # ========== 养护记录 ==========
    
    def add_care_log(self, plant_id: int, user_id: int, action_type: str,
                     action_details: str = None, photo_url: str = None) -> Dict[str, Any]:
        """添加养护记录"""
        log = self.db.add_care_log(plant_id, user_id, action_type, action_details, photo_url)
        return {'success': True, 'data': log}
    
    def get_care_logs(self, plant_id: int, limit: int = 50) -> Dict[str, Any]:
        """获取植物养护记录"""
        logs = self.db.get_plant_care_logs(plant_id, limit)
        return {'success': True, 'data': logs}
    
    def get_user_care_logs(self, user_id: int, limit: int = 100) -> Dict[str, Any]:
        """获取用户所有养护记录"""
        logs = self.db.get_user_care_logs(user_id, limit)
        return {'success': True, 'data': logs}
    
    def delete_care_log(self, log_id: int) -> Dict[str, Any]:
        """删除养护记录"""
        success = self.db.delete_care_log(log_id)
        return {'success': success}
    
    # ========== 快捷操作 ==========
    
    def water_plant(self, plant_id: int, user_id: int, notes: str = None) -> Dict[str, Any]:
        """浇水"""
        return self.add_care_log(plant_id, user_id, 'water', notes)
    
    def fertilize_plant(self, plant_id: int, user_id: int, notes: str = None) -> Dict[str, Any]:
        """施肥"""
        return self.add_care_log(plant_id, user_id, 'fertilize', notes)
    
    def harvest_plant(self, plant_id: int, user_id: int, notes: str = None) -> Dict[str, Any]:
        """收获"""
        # 添加养护记录
        log = self.add_care_log(plant_id, user_id, 'harvest', notes)
        # 更新植物状态
        if log['success']:
            self.db.update_plant(plant_id, status='harvested')
        return log