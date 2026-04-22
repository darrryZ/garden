#!/usr/bin/env python3
"""测试数据库服务器 API"""

import requests
import sys

BASE_URL = "http://localhost:3003"

def test_api():
    print("🧪 测试数据库服务器 API")
    print("=" * 50)
    
    # 测试植物类型 API
    try:
        r = requests.get(f"{BASE_URL}/api/plant-types", timeout=5)
        if r.status_code == 200:
            data = r.json()
            print(f"✅ /api/plant-types - 成功")
            print(f"   共 {len(data['data'])} 种植物类型")
            print(f"   示例: {', '.join([p['name'] for p in data['data'][:5]])}")
        else:
            print(f"❌ /api/plant-types - 状态码 {r.status_code}")
    except Exception as e:
        print(f"❌ /api/plant-types - 错误: {e}")
    
    print()
    
    # 测试分类 API
    try:
        r = requests.get(f"{BASE_URL}/api/categories", timeout=5)
        if r.status_code == 200:
            data = r.json()
            print(f"✅ /api/categories - 成功")
            print(f"   分类数: {len(data['data'])}")
        else:
            print(f"❌ /api/categories - 状态码 {r.status_code}")
    except Exception as e:
        print(f"❌ /api/categories - 错误: {e}")
    
    print()
    
    # 测试植物数据库 API
    try:
        r = requests.get(f"{BASE_URL}/api/plants?page=1&limit=5", timeout=5)
        if r.status_code == 200:
            data = r.json()
            print(f"✅ /api/plants - 成功")
            print(f"   总数: {data['pagination']['total']}")
        else:
            print(f"❌ /api/plants - 状态码 {r.status_code}")
    except Exception as e:
        print(f"❌ /api/plants - 错误: {e}")
    
    print()
    print("=" * 50)
    print("✅ 测试完成!")

if __name__ == '__main__':
    test_api()
