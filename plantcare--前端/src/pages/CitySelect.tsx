/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// 热门城市列表
const HOT_CITIES = [
  { name: '北京', code: 'Beijing' },
  { name: '上海', code: 'Shanghai' },
  { name: '广州', code: 'Guangzhou' },
  { name: '深圳', code: 'Shenzhen' },
  { name: '杭州', code: 'Hangzhou' },
  { name: '成都', code: 'Chengdu' },
  { name: '武汉', code: 'Wuhan' },
  { name: '西安', code: 'Xian' },
  { name: '南京', code: 'Nanjing' },
  { name: '重庆', code: 'Chongqing' },
  { name: '天津', code: 'Tianjin' },
  { name: '苏州', code: 'Suzhou' },
];

// 全国城市列表（按拼音首字母分组）
const ALL_CITIES = [
  // A
  { name: '安庆', code: 'Anqing', group: 'A' },
  { name: '安阳', code: 'Anyang', group: 'A' },
  { name: '鞍山', code: 'Anshan', group: 'A' },
  { name: '澳门', code: 'Macau', group: 'A' },
  // B
  { name: '保定', code: 'Baoding', group: 'B' },
  { name: '包头', code: 'Baotou', group: 'B' },
  { name: '宝鸡', code: 'Baoji', group: 'B' },
  { name: '蚌埠', code: 'Bengbu', group: 'B' },
  { name: '滨州', code: 'Binzhou', group: 'B' },
  { name: '北海', code: 'Beihai', group: 'B' },
  { name: '本溪', code: 'Benxi', group: 'B' },
  { name: '白山', code: 'Baishan', group: 'B' },
  { name: '白城', code: 'Baicheng', group: 'B' },
  // C
  { name: '长沙', code: 'Changsha', group: 'C' },
  { name: '长春', code: 'Changchun', group: 'C' },
  { name: '常州', code: 'Changzhou', group: 'C' },
  { name: '沧州', code: 'Cangzhou', group: 'C' },
  { name: '常德', code: 'Changde', group: 'C' },
  { name: '郴州', code: 'Chenzhou', group: 'C' },
  { name: '赤峰', code: 'Chifeng', group: 'C' },
  { name: '承德', code: 'Chengde', group: 'C' },
  { name: '滁州', code: 'Chuzhou', group: 'C' },
  { name: '池州', code: 'Chizhou', group: 'C' },
  { name: '潮州', code: 'Chaozhou', group: 'C' },
  { name: '韶关', code: 'Shaoguan', group: 'C' },
  { name: '长治', code: 'Changzhi', group: 'C' },
  // D
  { name: '大连', code: 'Dalian', group: 'D' },
  { name: '东莞', code: 'Dongguan', group: 'D' },
  { name: '大庆', code: 'Daqing', group: 'D' },
  { name: '大同', code: 'Datong', group: 'D' },
  { name: '丹东', code: 'Dandong', group: 'D' },
  { name: '德阳', code: 'Deyang', group: 'D' },
  { name: '德州', code: 'Dezhou', group: 'D' },
  { name: '达州', code: 'Dazhou', group: 'D' },
  { name: '大理', code: 'Dali', group: 'D' },
  { name: '敦煌', code: 'Dunhuang', group: 'D' },
  { name: '东营', code: 'Dongying', group: 'D' },
  // E
  { name: '鄂尔多斯', code: 'Ordos', group: 'E' },
  { name: '鄂州', code: 'Ezhou', group: 'E' },
  { name: '恩施', code: 'Enshi', group: 'E' },
  // F
  { name: '佛山', code: 'Foshan', group: 'F' },
  { name: '福州', code: 'Fuzhou', group: 'F' },
  { name: '抚顺', code: 'Fushun', group: 'F' },
  { name: '阜阳', code: 'Fuyang', group: 'F' },
  { name: '抚州', code: 'Fuzhou2', group: 'F' },
  { name: '防城港', code: 'Fangchenggang', group: 'F' },
  // G
  { name: '贵阳', code: 'Guiyang', group: 'G' },
  { name: '桂林', code: 'Guilin', group: 'G' },
  { name: '赣州', code: 'Ganzhou', group: 'G' },
  { name: '广安', code: 'Guangan', group: 'G' },
  { name: '广元', code: 'Guangyuan', group: 'G' },
  { name: '贵港', code: 'Guigang', group: 'G' },
  // H
  { name: '哈尔滨', code: 'Harbin', group: 'H' },
  { name: '合肥', code: 'Hefei', group: 'H' },
  { name: '海口', code: 'Haikou', group: 'H' },
  { name: '呼和浩特', code: 'Hohhot', group: 'H' },
  { name: '惠州', code: 'Huizhou', group: 'H' },
  { name: '邯郸', code: 'Handan', group: 'H' },
  { name: '衡阳', code: 'Hengyang', group: 'H' },
  { name: '淮安', code: 'Huaian', group: 'H' },
  { name: '湖州', code: 'Huzhou', group: 'H' },
  { name: '黄山', code: 'Huangshan', group: 'H' },
  { name: '淮南', code: 'Huainan', group: 'H' },
  { name: '淮北', code: 'Huaibei', group: 'H' },
  { name: '菏泽', code: 'Heze', group: 'H' },
  { name: '衡水', code: 'Hengshui', group: 'H' },
  { name: '怀化', code: 'Huaihua', group: 'H' },
  { name: '汉中', code: 'Hanzhong', group: 'H' },
  { name: '贺州', code: 'Hezhou', group: 'H' },
  { name: '河池', code: 'Hechi', group: 'H' },
  { name: '鹤岗', code: 'Hegang', group: 'H' },
  { name: '黑河', code: 'Heihe', group: 'H' },
  // J
  { name: '济南', code: 'Jinan', group: 'J' },
  { name: '吉林', code: 'Jilin', group: 'J' },
  { name: '嘉兴', code: 'Jiaxing', group: 'J' },
  { name: '金华', code: 'Jinhua', group: 'J' },
  { name: '济宁', code: 'Jining', group: 'J' },
  { name: '江门', code: 'Jiangmen', group: 'J' },
  { name: '荆州', code: 'Jingzhou', group: 'J' },
  { name: '九江', code: 'Jiujiang', group: 'J' },
  { name: '锦州', code: 'Jinzhou', group: 'J' },
  { name: '晋城', code: 'Jincheng', group: 'J' },
  { name: '晋中', code: 'Jinzhong', group: 'J' },
  { name: '鸡西', code: 'Jixi', group: 'J' },
  { name: '佳木斯', code: 'Jiamusi', group: 'J' },
  { name: '焦作', code: 'Jiaozuo', group: 'J' },
  { name: '揭阳', code: 'Jieyang', group: 'J' },
  { name: '酒泉', code: 'Jiuquan', group: 'J' },
  // K
  { name: '昆明', code: 'Kunming', group: 'K' },
  { name: '开封', code: 'Kaifeng', group: 'K' },
  { name: '喀什', code: 'Kashgar', group: 'K' },
  { name: '克拉玛依', code: 'Karamay', group: 'K' },
  // L
  { name: '兰州', code: 'Lanzhou', group: 'L' },
  { name: '拉萨', code: 'Lhasa', group: 'L' },
  { name: '临沂', code: 'Linyi', group: 'L' },
  { name: '洛阳', code: 'Luoyang', group: 'L' },
  { name: '柳州', code: 'Liuzhou', group: 'L' },
  { name: '廊坊', code: 'Langfang', group: 'L' },
  { name: '连云港', code: 'Lianyungang', group: 'L' },
  { name: '聊城', code: 'Liaocheng', group: 'L' },
  { name: '丽水', code: 'Lishui', group: 'L' },
  { name: '六安', code: 'Luan', group: 'L' },
  { name: '龙岩', code: 'Longyan', group: 'L' },
  { name: '娄底', code: 'Loudi', group: 'L' },
  { name: '泸州', code: 'Luzhou', group: 'L' },
  { name: '乐山', code: 'Leshan', group: 'L' },
  { name: '凉山', code: 'Liangshan', group: 'L' },
  { name: '吕梁', code: 'Lvliang', group: 'L' },
  { name: '辽阳', code: 'Liaoyang', group: 'L' },
  { name: '辽源', code: 'Liaoyuan', group: 'L' },
  { name: '来宾', code: 'Laibin', group: 'L' },
  { name: '临沧', code: 'Lincang', group: 'L' },
  { name: '林芝', code: 'Nyingchi', group: 'L' },
  // M
  { name: '绵阳', code: 'Mianyang', group: 'M' },
  { name: '牡丹江', code: 'Mudanjiang', group: 'M' },
  { name: '茂名', code: 'Maoming', group: 'M' },
  { name: '马鞍山', code: 'Maanshan', group: 'M' },
  { name: '梅州', code: 'Meizhou', group: 'M' },
  { name: '眉山', code: 'Meishan', group: 'M' },
  // N
  { name: '南昌', code: 'Nanchang', group: 'N' },
  { name: '南宁', code: 'Nanning', group: 'N' },
  { name: '宁波', code: 'Ningbo', group: 'N' },
  { name: '南通', code: 'Nantong', group: 'N' },
  { name: '南阳', code: 'Nanyang', group: 'N' },
  { name: '南充', code: 'Nanchong', group: 'N' },
  { name: '内江', code: 'Neijiang', group: 'N' },
  { name: '宁德', code: 'Ningde', group: 'N' },
  { name: '南平', code: 'Nanping', group: 'N' },
  { name: '那曲', code: 'Nagqu', group: 'N' },
  // P
  { name: '平顶山', code: 'Pingdingshan', group: 'P' },
  { name: '盘锦', code: 'Panjin', group: 'P' },
  { name: '莆田', code: 'Putian', group: 'P' },
  { name: '萍乡', code: 'Pingxiang', group: 'P' },
  { name: '濮阳', code: 'Puyang', group: 'P' },
  { name: '攀枝花', code: 'Panzhihua', group: 'P' },
  { name: '普洱', code: 'Puer', group: 'P' },
  // Q
  { name: '青岛', code: 'Qingdao', group: 'Q' },
  { name: '泉州', code: 'Quanzhou', group: 'Q' },
  { name: '秦皇岛', code: 'Qinhuangdao', group: 'Q' },
  { name: '齐齐哈尔', code: 'Qiqihar', group: 'Q' },
  { name: '曲靖', code: 'Qujing', group: 'Q' },
  { name: '衢州', code: 'Quzhou', group: 'Q' },
  { name: '清远', code: 'Qingyuan', group: 'Q' },
  { name: '钦州', code: 'Qinzhou', group: 'Q' },
  { name: '七台河', code: 'Qitaihe', group: 'Q' },
  { name: '庆阳', code: 'Qingyang', group: 'Q' },
  // R
  { name: '日照', code: 'Rizhao', group: 'R' },
  { name: '日喀则', code: 'Shigatse', group: 'R' },
  // S
  { name: '沈阳', code: 'Shenyang', group: 'S' },
  { name: '石家庄', code: 'Shijiazhuang', group: 'S' },
  { name: '三亚', code: 'Sanya', group: 'S' },
  { name: '绍兴', code: 'Shaoxing', group: 'S' },
  { name: '汕头', code: 'Shantou', group: 'S' },
  { name: '宿迁', code: 'Suqian', group: 'S' },
  { name: '四平', code: 'Siping', group: 'S' },
  { name: '松原', code: 'Songyuan', group: 'S' },
  { name: '双鸭山', code: 'Shuangyashan', group: 'S' },
  { name: '绥化', code: 'Suihua', group: 'S' },
  { name: '上海', code: 'Shanghai', group: 'S' },
  { name: '苏州', code: 'Suzhou', group: 'S' },
  { name: '深圳', code: 'Shenzhen', group: 'S' },
  { name: '十堰', code: 'Shiyan', group: 'S' },
  { name: '随州', code: 'Suizhou', group: 'S' },
  { name: '邵阳', code: 'Shaoyang', group: 'S' },
  { name: '朔州', code: 'Shuozhou', group: 'S' },
  { name: '三明', code: 'Sanming', group: 'S' },
  { name: '上饶', code: 'Shangrao', group: 'S' },
  { name: '商丘', code: 'Shangqiu', group: 'S' },
  { name: '三门峡', code: 'Sanmenxia', group: 'S' },
  { name: '汕尾', code: 'Shanwei', group: 'S' },
  { name: '韶关', code: 'Shaoguan', group: 'S' },
  { name: '阳江', code: 'Yangjiang', group: 'S' },
  { name: '遂宁', code: 'Suining', group: 'S' },
  { name: '商洛', code: 'Shangluo', group: 'S' },
  { name: '石嘴山', code: 'Shizuishan', group: 'S' },
  { name: '石河子', code: 'Shihezi', group: 'S' },
  // T
  { name: '太原', code: 'Taiyuan', group: 'T' },
  { name: '唐山', code: 'Tangshan', group: 'T' },
  { name: '台州', code: 'Taizhou', group: 'T' },
  { name: '泰安', code: 'Taian', group: 'T' },
  { name: '泰州', code: 'Taizhou2', group: 'T' },
  { name: '铜川', code: 'Tongchuan', group: 'T' },
  { name: '天津', code: 'Tianjin', group: 'T' },
  { name: '通辽', code: 'Tongliao', group: 'T' },
  { name: '通化', code: 'Tonghua', group: 'T' },
  { name: '铁岭', code: 'Tieling', group: 'T' },
  { name: '铜陵', code: 'Tongling', group: 'T' },
  { name: '铜仁', code: 'Tongren', group: 'T' },
  { name: '天水', code: 'Tianshui', group: 'T' },
  { name: '吐鲁番', code: 'Turpan', group: 'T' },
  { name: '塔城', code: 'Tacheng', group: 'T' },
  { name: '台北', code: 'Taipei', group: 'T' },
  { name: '台中', code: 'Taichung', group: 'T' },
  { name: '台南', code: 'Tainan', group: 'T' },
  // W
  { name: '无锡', code: 'Wuxi', group: 'W' },
  { name: '温州', code: 'Wenzhou', group: 'W' },
  { name: '威海', code: 'Weihai', group: 'W' },
  { name: '潍坊', code: 'Weifang', group: 'W' },
  { name: '乌鲁木齐', code: 'Urumqi', group: 'W' },
  { name: '芜湖', code: 'Wuhu', group: 'W' },
  { name: '梧州', code: 'Wuzhou', group: 'W' },
  { name: '武汉', code: 'Wuhan', group: 'W' },
  { name: '武威', code: 'Wuwei', group: 'W' },
  { name: '渭南', code: 'Weinan', group: 'W' },
  { name: '文山', code: 'Wenshan', group: 'W' },
  { name: '吴忠', code: 'Wuzhong', group: 'W' },
  // X
  { name: '厦门', code: 'Xiamen', group: 'X' },
  { name: '徐州', code: 'Xuzhou', group: 'X' },
  { name: '襄阳', code: 'Xiangyang', group: 'X' },
  { name: '湘潭', code: 'Xiangtan', group: 'X' },
  { name: '新乡', code: 'Xinxiang', group: 'X' },
  { name: '许昌', code: 'Xuchang', group: 'X' },
  { name: '咸阳', code: 'Xianyang', group: 'X' },
  { name: '西宁', code: 'Xining', group: 'X' },
  { name: '西安', code: 'Xian', group: 'X' },
  { name: '孝感', code: 'Xiaogan', group: 'X' },
  { name: '咸宁', code: 'Xianning', group: 'X' },
  { name: '湘西', code: 'Xiangxi', group: 'X' },
  { name: '忻州', code: 'Xinzhou', group: 'X' },
  { name: '西双版纳', code: 'Xishuangbanna', group: 'X' },
  { name: '宣城', code: 'Xuancheng', group: 'X' },
  { name: '新余', code: 'Xinyu', group: 'X' },
  { name: '信阳', code: 'Xinyang', group: 'X' },
  { name: '邢台', code: 'Xingtai', group: 'X' },
  { name: '香港', code: 'HongKong', group: 'X' },
  // Y
  { name: '烟台', code: 'Yantai', group: 'Y' },
  { name: '扬州', code: 'Yangzhou', group: 'Y' },
  { name: '盐城', code: 'Yancheng', group: 'Y' },
  { name: '宜昌', code: 'Yichang', group: 'Y' },
  { name: '岳阳', code: 'Yueyang', group: 'Y' },
  { name: '银川', code: 'Yinchuan', group: 'Y' },
  { name: '宜宾', code: 'Yibin', group: 'Y' },
  { name: '益阳', code: 'Yiyang', group: 'Y' },
  { name: '榆林', code: 'Yulin', group: 'Y' },
  { name: '营口', code: 'Yingkou', group: 'Y' },
  { name: '延边', code: 'Yanbian', group: 'Y' },
  { name: '伊春', code: 'Yichun', group: 'Y' },
  { name: '鹰潭', code: 'Yingtan', group: 'Y' },
  { name: '宜春', code: 'Yichun2', group: 'Y' },
  { name: '永州', code: 'Yongzhou', group: 'Y' },
  { name: '玉林', code: 'Yulin2', group: 'Y' },
  { name: '玉溪', code: 'Yuxi', group: 'Y' },
  { name: '雅安', code: 'Yaan', group: 'Y' },
  { name: '延安', code: 'Yanan', group: 'Y' },
  { name: '阳泉', code: 'Yangquan', group: 'Y' },
  { name: '运城', code: 'Yuncheng', group: 'Y' },
  // Z
  { name: '郑州', code: 'Zhengzhou', group: 'Z' },
  { name: '珠海', code: 'Zhuhai', group: 'Z' },
  { name: '中山', code: 'Zhongshan', group: 'Z' },
  { name: '镇江', code: 'Zhenjiang', group: 'Z' },
  { name: '株洲', code: 'Zhuzhou', group: 'Z' },
  { name: '淄博', code: 'Zibo', group: 'Z' },
  { name: '张家口', code: 'Zhangjiakou', group: 'Z' },
  { name: '湛江', code: 'Zhanjiang', group: 'Z' },
  { name: '肇庆', code: 'Zhaoqing', group: 'Z' },
  { name: '舟山', code: 'Zhoushan', group: 'Z' },
  { name: '漳州', code: 'Zhangzhou', group: 'Z' },
  { name: '枣庄', code: 'Zaozhuang', group: 'Z' },
  { name: '周口', code: 'Zhoukou', group: 'Z' },
  { name: '驻马店', code: 'Zhumadian', group: 'Z' },
  { name: '张家界', code: 'Zhangjiajie', group: 'Z' },
  { name: '自贡', code: 'Zigong', group: 'Z' },
  { name: '资阳', code: 'Ziyang', group: 'Z' },
  { name: '遵义', code: 'Zunyi', group: 'Z' },
  { name: '张掖', code: 'Zhangye', group: 'Z' },
  { name: '中卫', code: 'Zhongwei', group: 'Z' },
];

// 按字母分组的城市
const GROUPED_CITIES = ALL_CITIES.reduce((acc, city) => {
  if (!acc[city.group]) acc[city.group] = [];
  acc[city.group].push(city);
  return acc;
}, {} as Record<string, typeof ALL_CITIES>);

export function CitySelect() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('selectedCity') || 'Shanghai';
  });

  // 过滤搜索结果（搜索所有城市）
  const filteredCities = searchQuery
    ? [...HOT_CITIES, ...ALL_CITIES].filter(
        (city) =>
          city.name.includes(searchQuery) ||
          city.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // 选择城市
  const handleSelectCity = (cityCode: string) => {
    localStorage.setItem('selectedCity', cityCode);
    setSelectedCity(cityCode);
    navigate(-1); // 返回上一页
  };

  // 定位当前城市
  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 这里可以调用反向地理编码API获取城市名
          // 简化处理：提示用户
          alert('已获取位置，请从列表中选择对应城市');
        },
        () => {
          alert('无法获取位置信息');
        }
      );
    } else {
      alert('浏览器不支持地理定位');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">选择城市</h1>
        </div>

        {/* 搜索框 */}
        <div className="mt-3 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="搜索城市"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 border-0 focus-visible:ring-2 focus-visible:ring-green-500"
          />
        </div>

        {/* 定位当前位置 */}
        <button
          onClick={handleLocate}
          className="mt-3 flex items-center gap-2 text-sm text-green-600 hover:text-green-700"
        >
          <Navigation size={16} />
          <span>定位当前位置</span>
        </button>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-4">
          {/* 搜索结果 */}
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-500 mb-3">搜索结果</h2>
              {filteredCities.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {filteredCities.map((city) => (
                    <button
                      key={city.code}
                      onClick={() => handleSelectCity(city.code)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        selectedCity === city.code
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">未找到匹配的城市</p>
              )}
            </div>
          )}

          {/* 热门城市 */}
          {!searchQuery && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-red-500" />
                  <h2 className="text-sm font-medium text-gray-500">热门城市</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {HOT_CITIES.map((city) => (
                    <button
                      key={city.code}
                      onClick={() => handleSelectCity(city.code)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        selectedCity === city.code
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 按字母分组的城市 */}
              <div className="space-y-4">
                {Object.entries(GROUPED_CITIES).map(([letter, cities]) => (
                  <div key={letter}>
                    <h3 className="text-sm font-medium text-gray-400 mb-2 px-1">{letter}</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {cities.map((city) => (
                        <button
                          key={city.code}
                          onClick={() => handleSelectCity(city.code)}
                          className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${
                            selectedCity === city.code
                              ? 'bg-green-500 text-white shadow-md'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
