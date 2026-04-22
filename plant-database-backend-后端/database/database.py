"""
花园应用数据库模块
支持用户管理和花园植物信息
"""

import sqlite3
import json
import hashlib
import secrets
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from pathlib import Path

# 数据库路径
DB_PATH = Path(__file__).parent / "garden.db"


class GardenDatabase:
    """花园应用数据库管理类"""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or DB_PATH
        self._init_database()
    
    @contextmanager
    def _get_connection(self):
        """获取数据库连接上下文管理器"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row  # 使查询结果可以通过列名访问
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def _init_database(self):
        """初始化数据库表结构"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # 用户表 - 存储登录信息
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    display_name TEXT,
                    avatar_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    is_admin BOOLEAN DEFAULT 0
                )
            ''')
            
            # 用户会话表 - 用于保持登录状态
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    session_token TEXT UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            ''')
            
            # 花园表 - 每个用户可以有一个或多个花园
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS gardens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    location TEXT,
                    size_sqm REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            ''')
            
            # 植物类型表 - 预定义的植物类型
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS plant_types (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    scientific_name TEXT,
                    category TEXT,  -- 花卉/蔬菜/水果/香草/树木/其他
                    description TEXT,
                    care_instructions TEXT,  -- JSON格式存储养护说明
                    icon_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 用户植物表 - 用户花园中的具体植物
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_plants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    garden_id INTEGER,
                    plant_type_id INTEGER,
                    custom_name TEXT,  -- 用户给植物起的名字
                    status TEXT DEFAULT 'growing',  -- growing/thriving/dormant/dead/harvested
                    planted_at TIMESTAMP,
                    expected_harvest_at TIMESTAMP,
                    last_watered_at TIMESTAMP,
                    last_fertilized_at TIMESTAMP,
                    notes TEXT,
                    position_x REAL,  -- 在花园中的位置
                    position_y REAL,
                    image_urls TEXT,  -- JSON数组存储图片URL
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE SET NULL,
                    FOREIGN KEY (plant_type_id) REFERENCES plant_types(id) ON DELETE SET NULL
                )
            ''')
            
            # 植物养护记录表 - 浇水、施肥等操作记录
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS plant_care_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plant_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    action_type TEXT NOT NULL,  -- water/fertilize/prune/harvest/pest_control/note
                    action_details TEXT,
                    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    photo_url TEXT,
                    FOREIGN KEY (plant_id) REFERENCES user_plants(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            ''')
            
            # 创建索引优化查询
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_plants_user ON user_plants(user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_plants_garden ON user_plants(garden_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_care_logs_plant ON plant_care_logs(plant_id)')
            
            conn.commit()
    
    # ========== 用户管理方法 ==========
    
    def _hash_password(self, password: str, salt: str = None) -> tuple:
        """密码哈希处理"""
        if salt is None:
            salt = secrets.token_hex(16)
        # 使用 PBKDF2 进行密码哈希
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        return password_hash, salt
    
    def create_user(self, username: str, email: str, password: str, 
                    display_name: str = None, is_admin: bool = False) -> Dict[str, Any]:
        """创建新用户"""
        password_hash, salt = self._hash_password(password)
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, salt, display_name, is_admin)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (username, email, password_hash, salt, display_name, is_admin))
            
            conn.commit()
            user_id = cursor.lastrowid
            return self.get_user_by_id(user_id)
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取用户信息"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, username, email, display_name, avatar_url,
                       created_at, updated_at, last_login_at, is_active, is_admin
                FROM users WHERE id = ?
            ''', (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """根据邮箱获取用户信息"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, username, email, display_name, avatar_url,
                       created_at, updated_at, last_login_at, is_active, is_admin
                FROM users WHERE email = ?
            ''', (email,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def verify_password(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """验证用户密码"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, password_hash, salt FROM users WHERE email = ? AND is_active = 1
            ''', (email,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            password_hash, _ = self._hash_password(password, row['salt'])
            
            if password_hash == row['password_hash']:
                # 更新最后登录时间
                cursor.execute('''
                    UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
                ''', (row['id'],))
                return self.get_user_by_id(row['id'])
            return None
    
    def update_user(self, user_id: int, **kwargs) -> Optional[Dict[str, Any]]:
        """更新用户信息"""
        allowed_fields = ['username', 'email', 'display_name', 'avatar_url', 'is_active']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return None
        
        set_clause = ', '.join(f'{k} = ?' for k in updates.keys())
        values = list(updates.values()) + [user_id]
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f'''
                UPDATE users SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            ''', values)
            
            if cursor.rowcount > 0:
                return self.get_user_by_id(user_id)
            return None
    
    def change_password(self, user_id: int, new_password: str) -> bool:
        """修改用户密码"""
        password_hash, salt = self._hash_password(new_password)
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (password_hash, salt, user_id))
            return cursor.rowcount > 0
    
    # ========== 会话管理方法 ==========
    
    def create_session(self, user_id: int, expires_days: int = 30, 
                       ip_address: str = None, user_agent: str = None) -> str:
        """创建用户会话"""
        session_token = secrets.token_urlsafe(32)
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
                VALUES (?, ?, datetime('now', '+' || ? || ' days'), ?, ?)
            ''', (user_id, session_token, expires_days, ip_address, user_agent))
            conn.commit()
            return session_token
    
    def validate_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        """验证会话令牌"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT s.id, s.user_id, s.expires_at, u.username, u.email, u.display_name
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1
            ''', (session_token,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def delete_session(self, session_token: str) -> bool:
        """删除会话"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM user_sessions WHERE session_token = ?', (session_token,))
            return cursor.rowcount > 0
    
    def delete_user_sessions(self, user_id: int) -> int:
        """删除用户的所有会话（用于登出所有设备）"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM user_sessions WHERE user_id = ?', (user_id,))
            return cursor.rowcount
    
    # ========== 花园管理方法 ==========
    
    def create_garden(self, user_id: int, name: str, description: str = None,
                      location: str = None, size_sqm: float = None) -> Dict[str, Any]:
        """创建花园"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO gardens (user_id, name, description, location, size_sqm)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, name, description, location, size_sqm))
            conn.commit()
            garden_id = cursor.lastrowid
            return self.get_garden_by_id(garden_id)
    
    def get_garden_by_id(self, garden_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取花园信息"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM gardens WHERE id = ?', (garden_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_user_gardens(self, user_id: int) -> List[Dict[str, Any]]:
        """获取用户的所有花园"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM gardens WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
            return [dict(row) for row in cursor.fetchall()]
    
    def update_garden(self, garden_id: int, **kwargs) -> Optional[Dict[str, Any]]:
        """更新花园信息"""
        allowed_fields = ['name', 'description', 'location', 'size_sqm']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return None
        
        set_clause = ', '.join(f'{k} = ?' for k in updates.keys())
        values = list(updates.values()) + [garden_id]
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f'''
                UPDATE gardens SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            ''', values)
            
            if cursor.rowcount > 0:
                return self.get_garden_by_id(garden_id)
            return None
    
    def delete_garden(self, garden_id: int) -> bool:
        """删除花园（关联的植物会被设为garden_id=NULL）"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM gardens WHERE id = ?', (garden_id,))
            return cursor.rowcount > 0
    
    # ========== 植物类型管理 ==========
    
    def create_plant_type(self, name: str, scientific_name: str = None,
                          category: str = None, description: str = None,
                          care_instructions: Dict = None, icon_url: str = None) -> Dict[str, Any]:
        """创建植物类型"""
        care_json = json.dumps(care_instructions, ensure_ascii=False) if care_instructions else None
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO plant_types (name, scientific_name, category, description, care_instructions, icon_url)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (name, scientific_name, category, description, care_json, icon_url))
            conn.commit()
            plant_type_id = cursor.lastrowid
            return self.get_plant_type_by_id(plant_type_id)
    
    def get_plant_type_by_id(self, plant_type_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取植物类型"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM plant_types WHERE id = ?', (plant_type_id,))
            row = cursor.fetchone()
            if row:
                result = dict(row)
                if result.get('care_instructions'):
                    result['care_instructions'] = json.loads(result['care_instructions'])
                return result
            return None
    
    def get_all_plant_types(self, category: str = None) -> List[Dict[str, Any]]:
        """获取所有植物类型"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if category:
                cursor.execute('SELECT * FROM plant_types WHERE category = ? ORDER BY name', (category,))
            else:
                cursor.execute('SELECT * FROM plant_types ORDER BY name')
            
            results = []
            for row in cursor.fetchall():
                result = dict(row)
                if result.get('care_instructions'):
                    result['care_instructions'] = json.loads(result['care_instructions'])
                results.append(result)
            return results
    
    # ========== 用户植物管理 ==========
    
    def add_plant_to_garden(self, user_id: int, garden_id: int = None,
                            plant_type_id: int = None, custom_name: str = None,
                            planted_at: str = None, position_x: float = None,
                            position_y: float = None, notes: str = None) -> Dict[str, Any]:
        """向花园添加植物"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO user_plants 
                (user_id, garden_id, plant_type_id, custom_name, planted_at, position_x, position_y, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, garden_id, plant_type_id, custom_name, planted_at, position_x, position_y, notes))
            conn.commit()
            plant_id = cursor.lastrowid
            return self.get_plant_by_id(plant_id)
    
    def get_plant_by_id(self, plant_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取植物详情"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT p.*, pt.name as plant_type_name, pt.scientific_name, pt.category, pt.icon_url
                FROM user_plants p
                LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
                WHERE p.id = ?
            ''', (plant_id,))
            row = cursor.fetchone()
            if row:
                result = dict(row)
                if result.get('image_urls'):
                    result['image_urls'] = json.loads(result['image_urls'])
                return result
            return None
    
    def get_user_plants(self, user_id: int, garden_id: int = None, status: str = None) -> List[Dict[str, Any]]:
        """获取用户的植物列表"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            query = '''
                SELECT p.*, pt.name as plant_type_name, pt.scientific_name, pt.category, pt.icon_url
                FROM user_plants p
                LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
                WHERE p.user_id = ?
            '''
            params = [user_id]
            
            if garden_id is not None:
                query += ' AND p.garden_id = ?'
                params.append(garden_id)
            if status:
                query += ' AND p.status = ?'
                params.append(status)
            
            query += ' ORDER BY p.created_at DESC'
            
            cursor.execute(query, params)
            results = []
            for row in cursor.fetchall():
                result = dict(row)
                if result.get('image_urls'):
                    result['image_urls'] = json.loads(result['image_urls'])
                results.append(result)
            return results
    
    def update_plant(self, plant_id: int, **kwargs) -> Optional[Dict[str, Any]]:
        """更新植物信息"""
        allowed_fields = ['garden_id', 'custom_name', 'status', 'planted_at',
                         'expected_harvest_at', 'last_watered_at', 'last_fertilized_at',
                         'notes', 'position_x', 'position_y', 'image_urls']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return None
        
        # 处理JSON字段
        if 'image_urls' in updates and isinstance(updates['image_urls'], (list, dict)):
            updates['image_urls'] = json.dumps(updates['image_urls'], ensure_ascii=False)
        
        set_clause = ', '.join(f'{k} = ?' for k in updates.keys())
        values = list(updates.values()) + [plant_id]
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f'''
                UPDATE user_plants SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            ''', values)
            
            if cursor.rowcount > 0:
                return self.get_plant_by_id(plant_id)
            return None
    
    def delete_plant(self, plant_id: int) -> bool:
        """删除植物"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM user_plants WHERE id = ?', (plant_id,))
            return cursor.rowcount > 0
    
    # ========== 养护记录管理 ==========
    
    def add_care_log(self, plant_id: int, user_id: int, action_type: str,
                     action_details: str = None, photo_url: str = None) -> Dict[str, Any]:
        """添加养护记录"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO plant_care_logs (plant_id, user_id, action_type, action_details, photo_url)
                VALUES (?, ?, ?, ?, ?)
            ''', (plant_id, user_id, action_type, action_details, photo_url))
            conn.commit()
            log_id = cursor.lastrowid
            
            # 更新植物的最后养护时间
            if action_type == 'water':
                cursor.execute('''
                    UPDATE user_plants SET last_watered_at = CURRENT_TIMESTAMP WHERE id = ?
                ''', (plant_id,))
            elif action_type == 'fertilize':
                cursor.execute('''
                    UPDATE user_plants SET last_fertilized_at = CURRENT_TIMESTAMP WHERE id = ?
                ''', (plant_id,))
            
            return self.get_care_log_by_id(log_id)
    
    def get_care_log_by_id(self, log_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取养护记录"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM plant_care_logs WHERE id = ?', (log_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_plant_care_logs(self, plant_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """获取植物的养护记录"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM plant_care_logs
                WHERE plant_id = ?
                ORDER BY performed_at DESC
                LIMIT ?
            ''', (plant_id, limit))
            return [dict(row) for row in cursor.fetchall()]
    
    def get_user_care_logs(self, user_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        """获取用户的所有养护记录"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT l.*, p.custom_name as plant_name, pt.name as plant_type_name
                FROM plant_care_logs l
                JOIN user_plants p ON l.plant_id = p.id
                LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
                WHERE l.user_id = ?
                ORDER BY l.performed_at DESC
                LIMIT ?
            ''', (user_id, limit))
            return [dict(row) for row in cursor.fetchall()]
    
    def delete_care_log(self, log_id: int) -> bool:
        """删除养护记录"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM plant_care_logs WHERE id = ?', (log_id,))
            return cursor.rowcount > 0
    
    # ========== 统计和查询方法 ==========
    
    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """获取用户统计数据"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # 植物统计
            cursor.execute('''
                SELECT status, COUNT(*) as count FROM user_plants WHERE user_id = ? GROUP BY status
            ''', (user_id,))
            plant_stats = {row['status']: row['count'] for row in cursor.fetchall()}
            
            # 花园数量
            cursor.execute('SELECT COUNT(*) as count FROM gardens WHERE user_id = ?', (user_id,))
            garden_count = cursor.fetchone()['count']
            
            # 养护记录数量
            cursor.execute('SELECT COUNT(*) as count FROM plant_care_logs WHERE user_id = ?', (user_id,))
            care_log_count = cursor.fetchone()['count']
            
            # 本月养护次数
            cursor.execute('''
                SELECT COUNT(*) as count FROM plant_care_logs
                WHERE user_id = ? AND strftime('%Y-%m', performed_at) = strftime('%Y-%m', 'now')
            ''', (user_id,))
            monthly_care_count = cursor.fetchone()['count']
            
            return {
                'total_plants': sum(plant_stats.values()),
                'plants_by_status': plant_stats,
                'garden_count': garden_count,
                'total_care_logs': care_log_count,
                'monthly_care_count': monthly_care_count
            }
    
    def get_plants_needing_care(self, user_id: int, days_since_watered: int = 3) -> List[Dict[str, Any]]:
        """获取需要浇水的植物"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT p.*, pt.name as plant_type_name, pt.icon_url,
                       julianday('now') - julianday(COALESCE(p.last_watered_at, p.planted_at)) as days_since_watered
                FROM user_plants p
                LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
                WHERE p.user_id = ? AND p.status = 'growing'
                AND (p.last_watered_at IS NULL OR 
                     julianday('now') - julianday(p.last_watered_at) >= ?)
                ORDER BY p.last_watered_at ASC
            ''', (user_id, days_since_watered))
            return [dict(row) for row in cursor.fetchall()]


# 全局数据库实例
db = GardenDatabase()


# 便捷函数
if __name__ == '__main__':
    # 测试代码
    print("数据库初始化完成！")
    print(f"数据库路径: {DB_PATH}")
    
    # 创建测试用户
    try:
        user = db.create_user('testuser', 'test@example.com', 'password123', '测试用户')
        print(f"创建测试用户: {user}")
    except sqlite3.IntegrityError:
        user = db.get_user_by_email('test@example.com')
        print(f"用户已存在: {user}")
    
    # 创建植物类型
    try:
        plant_type = db.create_plant_type(
            name='番茄',
            scientific_name='Solanum lycopersicum',
            category='蔬菜',
            description='常见的蔬菜，需要充足的阳光',
            care_instructions={'water': '每2-3天浇水', 'sunlight': '全日照'}
        )
        print(f"创建植物类型: {plant_type}")
    except sqlite3.IntegrityError:
        print("植物类型已存在")
    
    print("\n数据库测试完成！")
