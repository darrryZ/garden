import { Plant, OwnedPlant } from './types';

export const PLANTS: Plant[] = [
  {
    id: '1',
    name: '绿萝',
    scientificName: 'Epipremnum aureum',
    category: 'Indoor',
    image: 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
    description: '绿萝是天南星科麒麟叶属的常绿藤本植物，叶片呈心形，色泽翠绿，具有极强的生命力。它是最受欢迎的室内观叶植物之一，因其易于养护和优秀的空气净化能力而备受青睐。',
    difficulty: 'Easy',
    light: '半阴',
    temperature: '18-28°C',
    humidity: '60-80%',
    size: 'Large'
  },
  {
    id: '2',
    name: '虎皮兰',
    scientificName: 'Sansevieria trifasciata',
    category: 'Indoor',
    image: 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
    description: '虎皮兰又名虎尾兰、锦兰，是天门冬科虎尾兰属的多年生草本植物。叶片坚挺直立，有灰白和深绿相间的虎尾状横带斑纹，株形优美，是极佳的室内观叶植物。',
    difficulty: 'Easy',
    light: '半阴',
    temperature: '18-27°C',
    humidity: '40-60%',
    size: 'Large'
  },
  {
    id: '3',
    name: '吊兰',
    scientificName: 'Chlorophytum comosum',
    category: 'Indoor',
    image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400',
    description: '吊兰是天门冬科吊兰属的多年生常绿草本植物，叶片细长柔软，从叶腋中抽生出走茎，走茎上会长出小植株，自然下垂，形似兰花，优雅别致，被誉为"空中仙子"。',
    difficulty: 'Easy',
    light: '半阴',
    temperature: '18-27°C',
    humidity: '40-60%',
    size: 'Large'
  },
  {
    id: '4',
    name: '发财树',
    scientificName: 'Pachira aquatica',
    category: 'Indoor',
    image: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=400',
    description: '发财树，学名瓜栗，是锦葵科瓜栗属的常绿乔木。原产于中美洲热带地区，树干基部膨大，叶片掌状复叶，四季常青。因其名字寓意吉祥，成为最受欢迎的室内盆栽之一。',
    difficulty: 'Easy',
    light: '半阴',
    temperature: '18-28°C',
    humidity: '60-80%',
    size: 'Large'
  },
  {
    id: '5',
    name: '龟背竹',
    scientificName: 'Monstera deliciosa',
    category: 'Indoor',
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400',
    description: '龟背竹是天南星科龟背竹属的常绿藤本植物，幼叶心形，成年叶片羽状深裂，形似龟背，因此得名。叶片巨大而奇特，是极具观赏价值的热带观叶植物。',
    difficulty: 'Easy',
    light: '半阴',
    temperature: '18-28°C',
    humidity: '60-80%',
    size: 'Large'
  },
  {
    id: '6',
    name: '琴叶榕',
    scientificName: 'Ficus lyrata',
    category: 'Indoor',
    image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=400',
    description: '琴叶榕是桑科的常绿观叶植物，叶片翠绿优美，四季常青，是极佳的室内绿化装饰植物。原产于西非，适应性强，在室内环境下也能良好生长。养护难度较低，适合新手植物爱好者种植。',
    difficulty: 'Easy',
    light: '半阴',
    temperature: '20-30°C',
    humidity: '50-70%',
    size: 'Large'
  },
  {
    id: '7',
    name: '橡皮树',
    scientificName: 'Ficus elastica',
    category: 'Indoor',
    image: 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400',
    description: '橡皮树是桑科的常绿观叶植物，叶片翠绿优美，四季常青，是极佳的室内绿化装饰植物。原产于印度，适应性强，在室内环境下也能良好生长。养护难度较低，适合新手植物爱好者种植。',
    difficulty: 'Easy',
    light: '半阴',
    temperature: '20-30°C',
    humidity: '50-70%',
    size: 'Large'
  },
  {
    id: '8',
    name: '滴水观音',
    scientificName: 'Alocasia macrorrhiza',
    category: 'Indoor',
    image: 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
    description: '滴水观音是天南星科的常绿观叶植物，叶片翠绿优美，四季常青，是极佳的室内绿化装饰植物。原产于东南亚，适应性强，在室内环境下也能良好生长。养护难度较低，适合新手植物爱好者种植。',
    difficulty: 'Easy',
    light: '半阴',
    temperature: '18-28°C',
    humidity: '60-80%',
    size: 'Large'
  },
  {
    id: '9',
    name: '万年青',
    scientificName: 'Rohdea japonica',
    category: 'Indoor',
    image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400',
    description: '万年青是天门冬科的常绿观叶植物，叶片翠绿优美，四季常青，是极佳的室内绿化装饰植物。原产于中国，适应性强，在室内环境下也能良好生长。养护难度较低，适合新手植物爱好者种植。',
    difficulty: 'Easy',
    light: '半阴',
    temperature: '18-27°C',
    humidity: '40-60%',
    size: 'Large'
  },
  {
    id: '10',
    name: '竹芋',
    scientificName: 'Calathea spp.',
    category: 'Indoor',
    image: 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
    description: '竹芋是竹芋科的常绿观叶植物，叶片翠绿优美，四季常青，是极佳的室内绿化装饰植物。原产于热带美洲，适应性强，在室内环境下也能良好生长。养护难度较低，适合新手植物爱好者种植。',
    difficulty: 'Easy',
    light: '半阴',
    temperature: '18-25°C',
    humidity: '70-80%',
    size: 'Large'
  }
];

export const MY_GARDEN: OwnedPlant[] = [
  {
    ...PLANTS[0],
    nickname: '我的绿萝',
    addedDate: '2026.04.01',
    healthStatus: 'Healthy',
    milestones: [
      { id: 'm1', date: '2026.04.01', title: '种植' },
      { id: 'm2', date: '2026.04.02', title: '发芽🌱' },
      { id: 'm3', date: '2026.04.03', title: '茁壮成长' }
    ],
    tasks: [
      { id: 't1', title: '浇水', completed: true },
      { id: 't2', title: '施肥', completed: false }
    ]
  },
  {
    ...PLANTS[1],
    nickname: '我的虎皮兰',
    addedDate: '2026.04.02',
    healthStatus: 'Healthy',
    milestones: [],
    tasks: []
  }
];