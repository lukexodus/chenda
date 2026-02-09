-- Seed Data: Product Types (USDA FoodKeeper Database)
-- Date: 2026-02-09T02:56:09.721Z
-- Total items: 180

-- Disable triggers for faster insertion
SET session_replication_role = 'replica';

INSERT INTO product_types (
  id,
  name,
  name_subtitle,
  category_id,
  keywords,
  default_shelf_life_days,
  default_storage_condition,
  shelf_life_source
) VALUES
  (
    2,
    'Buttermilk',
    NULL,
    7,
    'Buttermilk',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    5,
    'Cheese',
    'shredded; cheddar, mozzarella, etc.',
    7,
    'Cheese,shredded,cheddar,mozzarella',
    30,
    'refrigerated_opened',
    '{"min":1,"max":1,"metric":"Months"}'::jsonb
  ),
  (
    6,
    'Cheese',
    'processed slices',
    7,
    'Cheese,processed slices,slices,slice',
    25,
    'refrigerated_opened',
    '{"min":3,"max":4,"metric":"Weeks"}'::jsonb
  ),
  (
    7,
    'Cheese',
    'soft such as brie, bel paese, goat',
    7,
    'Cheese,brie, bel paese, goat',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    8,
    'Coffee creamer',
    'liquid refrigerated',
    7,
    'Coffee creamer,Coffee, creamer,liquid refrigerated',
    21,
    'refrigerated_opened',
    '{"min":3,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    9,
    'Cottage cheese',
    NULL,
    7,
    'Cottage cheese,cheese',
    14,
    'refrigerated_opened',
    '{"min":2,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    10,
    'Cream cheese',
    NULL,
    7,
    NULL,
    14,
    'refrigerated_opened',
    '{"min":2,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    11,
    'Cream',
    'whipping, ultrapasteurized',
    7,
    'Cream,whipping,ultrapasteurized',
    30,
    'refrigerated_opened',
    '{"min":1,"max":1,"metric":"Months"}'::jsonb
  ),
  (
    12,
    'Cream',
    'whipped, sweetened',
    7,
    'Cream,whipped, sweetened',
    1,
    'refrigerated',
    '{"min":1,"max":1,"metric":"Days"}'::jsonb
  ),
  (
    13,
    'Cream',
    'half and half',
    7,
    'Cream,half',
    4,
    'refrigerated_opened',
    '{"min":3,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    14,
    'Cream',
    'heavy',
    7,
    'Cream,heavy',
    10,
    'refrigerated_opened',
    '{"min":10,"max":10,"metric":"Days"}'::jsonb
  ),
  (
    15,
    'Cream',
    'light',
    7,
    'Cream,light',
    7,
    'refrigerated_opened',
    '{"min":1,"max":1,"metric":"Weeks"}'::jsonb
  ),
  (
    16,
    'Dips',
    'sour cream based',
    7,
    'Dips,sour cream based,sour,cream based,cream,dip',
    14,
    'refrigerated_opened',
    '{"min":2,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    17,
    'Egg substitutes',
    'liquid',
    7,
    'Egg substitutes,liquid,egg,substitutes,substitute',
    7,
    'refrigerated_opened',
    '{"min":7,"max":7,"metric":"Days"}'::jsonb
  ),
  (
    20,
    'Eggnog',
    'commercial',
    7,
    'Eggnog,commercial,egg,nog',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    21,
    'Eggs',
    'in shell',
    7,
    'Eggs,in shell,egg,shell',
    28,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Weeks"}'::jsonb
  ),
  (
    22,
    'Eggs',
    'raw whites, yolks',
    7,
    'Eggs,raw whites, yolks,egg,whites',
    3,
    'refrigerated',
    '{"min":2,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    23,
    'Eggs',
    'hard boiled cooked',
    7,
    'Eggs,egg,hard boiled cooked,boiled,hard boiled',
    7,
    'refrigerated',
    '{"min":1,"max":1,"metric":"Weeks"}'::jsonb
  ),
  (
    24,
    'Egg dishes',
    NULL,
    7,
    'Egg dishes,egg,dishes',
    4,
    'refrigerated',
    '{"min":3,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    25,
    'Kefir',
    'fermented milk',
    7,
    'Kefir,fermented milk,milk,fermented',
    7,
    'refrigerated_opened',
    '{"min":1,"max":1,"metric":"Weeks"}'::jsonb
  ),
  (
    30,
    'Whipped cream',
    'aerosol can',
    7,
    'Whipped cream,cream,aerosol can,can',
    25,
    'refrigerated_opened',
    '{"min":3,"max":4,"metric":"Weeks"}'::jsonb
  ),
  (
    32,
    'Whipped topping',
    'tub',
    7,
    'Whipped topping,topping,tub,whipped',
    14,
    'refrigerated_opened',
    '{"min":2,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    33,
    'Yogurt',
    NULL,
    7,
    'Yogurt',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    34,
    'Beef',
    'rib roast, bone-in',
    10,
    'Beef,rib roast,bone-in,roast,bone,rib',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    35,
    'Beef',
    'rib roast; boneless, rolled',
    10,
    'Beef,rib roast,boneless,rolled,roast,rib',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    36,
    'Beef',
    'round or rump roast',
    10,
    'Beef,round,rump roast,roast',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    37,
    'Beef',
    'tenderloin, whole',
    10,
    'Beef,tenderloin,whole',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    38,
    'Beef',
    'tenderloin, half',
    10,
    'Beef,tenderloin,half',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    39,
    'Beef',
    'chuck roast, brisket',
    10,
    'Beef,chuck roast,roast,brisket',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    40,
    'Beef',
    'steaks',
    10,
    'Beef,steaks,steak',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    41,
    'Beef',
    'stew, cubes',
    10,
    'Beef,stew, cubes,cube',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    42,
    'Beef',
    'short ribs',
    10,
    'Beef,short ribs,ribs,rib',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    43,
    'Beef',
    'ground',
    10,
    'Beef,ground',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    44,
    'Lamb',
    'leg, bone-in - small',
    10,
    'Lamb,leg,bone-in - small,bone-in,bone',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    45,
    'Lamb',
    'leg, bone-in - large',
    10,
    'Lamb,leg,bone-in - large,bone-in,bone',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    46,
    'Lamb',
    'leg; boneless, rolled',
    10,
    'Lamb,leg,boneless,rolled,bone',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    47,
    'Lamb',
    'crown roast',
    10,
    'Lamb,crown roast,roast',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    48,
    'Lamb',
    'shoulder roast or shank leg half',
    10,
    'Lamb,shoulder roast,roast,shoulder,shank leg half,half,shank,shank leg,leg',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    49,
    'Lamb',
    'cubes for kabobs',
    10,
    'Lamb,cubes,kabobs,cube,kabob',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    50,
    'Lamb',
    'ground',
    10,
    'Lamb,ground',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    51,
    'Lamb',
    'chops, ribs, or loin',
    10,
    'Lamb,chops,ribs,loin,rib',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    52,
    'Lamb',
    'leg steaks',
    10,
    'Lamb,leg steaks,steaks,steak,leg',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    53,
    'Lamb',
    'stew meat, pieces',
    10,
    'Lamb,stew,pieces,stew meat,meat,piece',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    54,
    'Lamb',
    'shanks',
    10,
    'Lamb,shanks,shank',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    55,
    'Lamb',
    'breast, rolled',
    10,
    'Lamb,breast,rolled',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    56,
    'Veal',
    'shoulder roast, boneless',
    10,
    'Veal,shoulder,boneless,shoulder roast,roast',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    57,
    'Veal',
    'leg rump or round roast, boneless',
    10,
    'Veal,leg rump,rump,leg,round,round roast,roast,boneless',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    58,
    'Veal',
    'loin roast, bone-in',
    10,
    'Veal,loin roast,bone-in,roast,bone,loin',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    59,
    'Veal',
    'ground',
    10,
    'Veal,ground',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    60,
    'Pork',
    'loin roast, bone-in',
    10,
    'Pork,loin roast,bone-in,roast,bone,loin',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    61,
    'Pork',
    'loin roast, boneless',
    10,
    'Pork,loin,boneless,loin roast,roast',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    63,
    'Pork',
    'loin chops, bone-in',
    10,
    'Pork,loin chops,bone-in,chops,bone,loin',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    64,
    'Pork',
    'loin chops, boneless',
    10,
    'Pork,loin,boneless,loin chops,chops',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    65,
    'Pork',
    'crown roast - small',
    10,
    'Pork,roast,crown,crown roast - small,small,crown roast',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    66,
    'Pork',
    'crown roast - large',
    10,
    'Pork,roast,crown,crown roast - large,large,crown roast',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    67,
    'Pork',
    'tenderloin',
    10,
    'Pork,tenderloin',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    69,
    'Pork',
    'tenderloin medallions or loin cubes',
    10,
    'Pork,tenderloin,tenderloin medallions,loin cubes,medallion,loin cube,loin,medallions,cube,cubes',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    70,
    'Goat',
    'tender whole cuts (legs, ribs, shoulder, loin)',
    10,
    'Goat,tender whole cuts,legs,ribs,shoulder,loin,tender,whole cuts,leg,rib',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    71,
    'Goat',
    'less tender whole cuts (stew meat, riblets, shanks)',
    10,
    'Goat,less tender whole cuts,stew meat,stew,meat,riblets,shanks,whole cuts,tender,less tender',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    72,
    'Pork',
    'ribs',
    10,
    'Pork,ribs,rib',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    73,
    'Pork',
    'ground',
    10,
    'Pork,ground',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    74,
    'Pork',
    'shoulder',
    10,
    'Pork,shoulder',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    75,
    'Pork',
    'loin, cubes',
    10,
    'Pork,loin,cubes,cube',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    76,
    'Venison',
    'round, rump, loin, or rib roast',
    10,
    'Venison,rump,round,loin,rib,rib roast,roast',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    77,
    'Variety meats',
    'liver, tongue, chitterlings, etc.',
    10,
    'Variety meats,liver,tongue,chitterlings,meats,meat,chitterling',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    78,
    'Goat',
    'ground',
    10,
    'Goat,ground',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    113,
    'Chicken',
    'whole',
    15,
    'Chicken,whole',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    114,
    'Turkey',
    'whole',
    15,
    'Turkey,whole',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    115,
    'Ground turkey or chicken',
    NULL,
    15,
    'Ground turkey,chicken,turkey',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    116,
    'Chicken parts',
    'breast halves, bone-in',
    15,
    'Chicken parts,breast halves,bone-in,halves,bone,breast,chicken,half',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    117,
    'Chicken parts',
    'breast halves, boneless',
    15,
    'Chicken parts,breast halves,boneless,chicken,breast,halves,half,bone',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    118,
    'Chicken parts',
    'legs or thighs',
    15,
    'Chicken parts,legs,thighs,chicken,leg,thigh',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    119,
    'Turkey parts',
    'breast halves, bone-in',
    15,
    'Turkey parts,breast halves,bone-in,halves,bone,breast,half,turkey',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    120,
    'Turkey parts',
    'breast halves, boneless',
    15,
    'Turkey parts,breast,boneless,bone,turkey',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    121,
    'Turkey parts',
    'legs or thighs',
    15,
    'Turkey parts,legs,thighs,turkey,leg,thigh',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    123,
    'Duckling',
    'domestic or wild, whole',
    15,
    'Duckling,domestic,wild,whole',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    125,
    'Goose',
    'domestic or wild, whole',
    15,
    'Goose,domestic,wild,whole',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    126,
    'Pheasant',
    'young, whole',
    15,
    'Pheasant,young,whole',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    127,
    'Quail',
    'whole',
    15,
    'Quail,whole',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    128,
    'Capon',
    'whole',
    15,
    'Capon,whole',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    129,
    'Cornish Hens',
    'whole',
    15,
    'Cornish Hens,Hens,whole,Hen',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    130,
    'Giblets',
    NULL,
    15,
    'Giblets,giblet',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    249,
    'Apricots',
    NULL,
    18,
    'Apricots,Apricot',
    4,
    'refrigerated',
    '{"min":2,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    250,
    'Avocados',
    NULL,
    18,
    'Avocados,Avocado',
    4,
    'refrigerated',
    '{"min":3,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    251,
    'Bananas',
    NULL,
    18,
    'Bananas,banana',
    3,
    'refrigerated',
    '{"min":3,"max":3,"metric":"Days"}'::jsonb
  ),
  (
    252,
    'Berries',
    'cherries, goose berries, lychee',
    18,
    'Berries,berry,cherries,cherry,goose berries,goose berry,lychee,gooseberries',
    7,
    'refrigerated_opened',
    '{"min":7,"max":7,"metric":"Days"}'::jsonb
  ),
  (
    253,
    'Berries',
    'blackberries, boysenberries, currant',
    18,
    'Berries,berry,blackberries,blackberry,boysenberries,boysenberry,currant',
    5,
    'refrigerated_opened',
    '{"min":3,"max":6,"metric":"Days"}'::jsonb
  ),
  (
    254,
    'Blueberries',
    NULL,
    18,
    'Blueberries,blueberry,berries,berry',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    255,
    'Cherimoya',
    NULL,
    18,
    'Cherimoya',
    4,
    'refrigerated',
    '{"min":4,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    256,
    'Citrus fruit',
    'lemon, lime, orange, grapefruit, tangerines, clementines',
    18,
    'Citrus fruit,fruit,citrus,lemon,lime,orange,grape,grapefruit,tangerines,tangerine,clementines,clementine',
    16,
    'refrigerated_opened',
    '{"min":10,"max":21,"metric":"Days"}'::jsonb
  ),
  (
    258,
    'Coconuts',
    'fresh',
    18,
    'Coconuts,Coconut,fresh',
    18,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    261,
    'Grapes',
    NULL,
    18,
    'Grapes,grape',
    7,
    'refrigerated_opened',
    '{"min":1,"max":1,"metric":"Weeks"}'::jsonb
  ),
  (
    262,
    'Guava',
    NULL,
    18,
    'Guava',
    3,
    'refrigerated',
    '{"min":2,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    263,
    'Kiwi fruit',
    NULL,
    18,
    'Kiwi fruit,kiwi,fruit',
    5,
    'refrigerated',
    '{"min":3,"max":6,"metric":"Days"}'::jsonb
  ),
  (
    264,
    'Melons',
    NULL,
    18,
    'Melons,melon',
    14,
    'refrigerated_opened',
    '{"min":2,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    265,
    'Papaya, mango, feijoa, passionfruit, casaha melon',
    NULL,
    18,
    'Papaya,mango,feijoa,passionfruit,casaha melon,melon,fruit,passion',
    7,
    'refrigerated_opened',
    '{"min":1,"max":1,"metric":"Weeks"}'::jsonb
  ),
  (
    266,
    'Peaches, nectarines, plums, pears, sapote',
    NULL,
    18,
    'Peaches,nectarines,plums,pears,sapote,peach,nectarine,plum,pear',
    4,
    'refrigerated',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    267,
    'Pineapple',
    NULL,
    18,
    'Pineapple',
    6,
    'refrigerated',
    '{"min":5,"max":7,"metric":"Days"}'::jsonb
  ),
  (
    268,
    'Plantains',
    NULL,
    18,
    'Plantains,plantain',
    4,
    'refrigerated',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    270,
    'Artichokes, whole',
    NULL,
    19,
    'Artichokes,artichoke,whole',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    271,
    'Asparagus',
    NULL,
    19,
    'Asparagus',
    4,
    'refrigerated_opened',
    '{"min":3,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    272,
    'Bamboo shoots',
    NULL,
    19,
    'Bamboo shoots,bamboo,shoots,shoot',
    14,
    'refrigerated_opened',
    '{"min":2,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    273,
    'Beans and peas',
    'green, fava, lima, soybean, wax, snow, sugar snap',
    19,
    'Beans,peas,green,fava,lima,soybean,wax,snow,sugar snap,sugar,pea,soya',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    274,
    'Beets',
    NULL,
    19,
    'Beets',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    275,
    'Bok choy',
    NULL,
    19,
    'Bok choy',
    3,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Days"}'::jsonb
  ),
  (
    276,
    'Broccoli and broccoli raab (rapini)',
    NULL,
    19,
    'Broccoli,broccoli raab,rapini,raab',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    277,
    'Brussels sprouts',
    NULL,
    19,
    'Brussels sprouts,brussels,sprouts,sprout,brussel',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    278,
    'Cabbage',
    NULL,
    19,
    'Cabbage',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    279,
    'Carrots, parsnips',
    NULL,
    19,
    'Carrots,parsnips,carrot,parsnip',
    18,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    280,
    'Cauliflower',
    NULL,
    19,
    'Cauliflower',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    281,
    'Celery',
    NULL,
    19,
    'Celery',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    282,
    'Corn on the cob',
    NULL,
    19,
    'Corn,cob',
    2,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    283,
    'Cucumbers',
    NULL,
    19,
    'Cucumbers,cucumber',
    5,
    'refrigerated_opened',
    '{"min":4,"max":6,"metric":"Days"}'::jsonb
  ),
  (
    284,
    'Eggplant',
    NULL,
    19,
    'Eggplant,egg',
    6,
    'refrigerated_opened',
    '{"min":4,"max":7,"metric":"Days"}'::jsonb
  ),
  (
    285,
    'Garlic',
    NULL,
    19,
    'Garlic',
    9,
    'refrigerated_opened',
    '{"min":3,"max":14,"metric":"Days"}'::jsonb
  ),
  (
    286,
    'Ginger root',
    NULL,
    19,
    'Ginger root,ginger,root',
    18,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    287,
    'Greens',
    NULL,
    19,
    'Greens,green',
    3,
    'refrigerated_opened',
    '{"min":1,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    288,
    'Herbs',
    NULL,
    19,
    'Herbs,herb',
    9,
    'refrigerated_opened',
    '{"min":7,"max":10,"metric":"Days"}'::jsonb
  ),
  (
    289,
    'Leeks',
    NULL,
    19,
    'Leeks,leek',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    290,
    'Lettuce',
    'iceberg, romaine',
    19,
    'Lettuce,iceberg,romaine',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    291,
    'Lettuce',
    'leaf, spinach',
    19,
    'Lettuce,leaf,spinach',
    5,
    'refrigerated_opened',
    '{"min":3,"max":7,"metric":"Days"}'::jsonb
  ),
  (
    292,
    'Mushrooms',
    NULL,
    19,
    'Mushroom,mushrooms',
    5,
    'refrigerated_opened',
    '{"min":3,"max":7,"metric":"Days"}'::jsonb
  ),
  (
    293,
    'Okra',
    NULL,
    19,
    'Okra',
    3,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Days"}'::jsonb
  ),
  (
    295,
    'Onions',
    'spring or green',
    19,
    'Onions,spring,green,onion',
    7,
    'refrigerated_opened',
    '{"min":1,"max":1,"metric":"Weeks"}'::jsonb
  ),
  (
    296,
    'Peppers',
    NULL,
    19,
    'Peppers,pepper',
    9,
    'refrigerated_opened',
    '{"min":4,"max":14,"metric":"Days"}'::jsonb
  ),
  (
    297,
    'Potatoes',
    NULL,
    19,
    'Potatoes,potato',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    299,
    'Radishes',
    NULL,
    19,
    'Radishes,radish',
    12,
    'refrigerated_opened',
    '{"min":10,"max":14,"metric":"Days"}'::jsonb
  ),
  (
    300,
    'Rhubarb',
    NULL,
    19,
    'Rhubarb',
    5,
    'refrigerated_opened',
    '{"min":3,"max":7,"metric":"Days"}'::jsonb
  ),
  (
    301,
    'Rutabagas',
    NULL,
    19,
    'Rutabagas',
    18,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    302,
    'Squash',
    'summer and zucchini',
    19,
    'Squash,summer,zucchini',
    5,
    'refrigerated_opened',
    '{"min":4,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    305,
    'Taro',
    NULL,
    19,
    'Taro',
    3,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Days"}'::jsonb
  ),
  (
    307,
    'Turnips',
    NULL,
    19,
    'Turnips,turnip',
    14,
    'refrigerated_opened',
    '{"min":2,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    308,
    'Yuca/cassava',
    NULL,
    19,
    'Yuca,cassava',
    3,
    'refrigerated_opened',
    '{"min":3,"max":3,"metric":"Days"}'::jsonb
  ),
  (
    414,
    'Kumquats',
    NULL,
    18,
    'Kumquats',
    21,
    'refrigerated',
    '{"min":3,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    415,
    'Bagged greens',
    'leaf, spinach, lettuce, etc.',
    19,
    'Bagged greens,leaf,spinach,lettuce,bagged,greens,green',
    4,
    'refrigerated',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    422,
    'Yams/sweet potatoes',
    NULL,
    19,
    'Yams,sweet potatoes,potatoes,potato,yam',
    18,
    'pantry_opened',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    423,
    'Kale',
    NULL,
    19,
    'Kale',
    4,
    'refrigerated_opened',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    478,
    'Star fruit',
    NULL,
    18,
    'Star fruit,fruit,fruits',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    479,
    'Prickly pear ',
    NULL,
    18,
    'Prickly pear,pear,pickle',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    480,
    'Pitaya/dragon fruit',
    NULL,
    18,
    'Pitaya,dragon fruit,fruit,fruits',
    18,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    481,
    'Strawberries',
    NULL,
    18,
    'Strawberries,strawberry',
    3,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Days"}'::jsonb
  ),
  (
    482,
    'Raspberries',
    NULL,
    18,
    'Raspberries,raspberry',
    3,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Days"}'::jsonb
  ),
  (
    483,
    'Cherries',
    NULL,
    18,
    'Cherries,cherry',
    3,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Days"}'::jsonb
  ),
  (
    490,
    'Ricotta',
    NULL,
    7,
    'Ricotta',
    14,
    'refrigerated_opened',
    '{"min":2,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    491,
    'Baby carrots',
    NULL,
    19,
    'Baby carrots, carrot,baby carrot',
    28,
    'refrigerated_opened',
    '{"min":4,"max":4,"metric":"Weeks"}'::jsonb
  ),
  (
    492,
    'Jicama',
    'fresh',
    19,
    'Jicama,fresh',
    18,
    'refrigerated_opened',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    494,
    'Kohlrabi',
    NULL,
    19,
    'Kohlrabi',
    7,
    'refrigerated_opened',
    '{"min":1,"max":1,"metric":"Weeks"}'::jsonb
  ),
  (
    495,
    'Watermelon',
    NULL,
    18,
    'Watermelon',
    4,
    'refrigerated_opened',
    '{"min":3,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    496,
    'Cantaloupe',
    NULL,
    18,
    'Cantaloupe',
    10,
    'refrigerated_opened',
    '{"min":5,"max":15,"metric":"Days"}'::jsonb
  ),
  (
    497,
    'Honeydew',
    NULL,
    18,
    'Honeydew',
    4,
    'refrigerated_opened',
    '{"min":3,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    505,
    'Lemongrass',
    NULL,
    19,
    'Lemongrass',
    8,
    'refrigerated_opened',
    '{"min":7,"max":9,"metric":"Days"}'::jsonb
  ),
  (
    506,
    'Cilantro',
    NULL,
    19,
    'Cilantro',
    18,
    'refrigerated',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    507,
    'Mint',
    NULL,
    19,
    'Mint',
    18,
    'refrigerated',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    509,
    'Basil',
    'fresh',
    19,
    'Basil,fresh',
    10,
    'refrigerated',
    '{"min":10,"max":10,"metric":"Days"}'::jsonb
  ),
  (
    510,
    'Oregano',
    NULL,
    19,
    'Oregano',
    18,
    'refrigerated',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    511,
    'Rosemary',
    NULL,
    19,
    'Rosemary',
    18,
    'refrigerated',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    512,
    'Chives',
    NULL,
    19,
    'Chives',
    18,
    'refrigerated',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    513,
    'Thyme',
    NULL,
    19,
    'Thyme',
    18,
    'refrigerated',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    546,
    'Quark',
    'fresh cheese',
    7,
    'Quark,fresh cheese,cheese',
    9,
    'refrigerated',
    '{"min":7,"max":10,"metric":"Days"}'::jsonb
  ),
  (
    547,
    'Zucchini',
    'fresh, whole',
    19,
    'Zucchini,fresh, whole',
    7,
    'refrigerated',
    '{"min":1,"max":1,"metric":"Weeks"}'::jsonb
  ),
  (
    548,
    'Hot peppers',
    NULL,
    19,
    'Hot peppers,pepper',
    7,
    'refrigerated_opened',
    '{"min":1,"max":1,"metric":"Weeks"}'::jsonb
  ),
  (
    549,
    'Bean sprouts',
    NULL,
    19,
    'Bean sprouts,bean,sprouts',
    8,
    'refrigerated_opened',
    '{"min":5,"max":10,"metric":"Days"}'::jsonb
  ),
  (
    550,
    'Swiss chard',
    NULL,
    19,
    'Swiss chard,chard',
    11,
    'refrigerated_opened',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    562,
    'Applesauce',
    'homemade',
    18,
    'Applesauce,homemade',
    21,
    'refrigerated',
    '{"min":3,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    570,
    'Marinated vegetables',
    'in oil',
    19,
    'Marinated vegetables,vegetables,oil,vegetable',
    4,
    'refrigerated',
    '{"min":3,"max":4,"metric":"Days"}'::jsonb
  ),
  (
    595,
    'Rabbit',
    'whole, fresh',
    10,
    'Rabbit,whole, fresh',
    2,
    'refrigerated',
    '{"min":2,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    596,
    'Spaghetti squash',
    'whole',
    19,
    'Spaghetti squash,squash,whole',
    11,
    'refrigerated',
    '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    597,
    'Spaghetti squash',
    'cut',
    19,
    'Spaghetti squash,squash,cut',
    5,
    'refrigerated',
    '{"min":4,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    600,
    'Cherry tomatoes',
    NULL,
    19,
    'Cherry, tomatoes,tomato',
    5,
    'refrigerated',
    '{"min":5,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    611,
    'Parsley',
    'fresh',
    19,
    'parsley',
    3,
    'refrigerated',
    '{"min":2,"max":3,"metric":"Days"}'::jsonb
  ),
  (
    621,
    'Bison',
    'whole',
    10,
    'bison whole,bison,whole',
    4,
    'refrigerated',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    622,
    'Bison',
    'ground',
    10,
    'ground bison,bison,ground',
    2,
    'refrigerated',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    628,
    'Cheese Curds',
    'fresh, unaged',
    7,
    'cheese curd,cheese,curd,curds,cheese curds',
    14,
    'refrigerated',
    '{"min":2,"max":2,"metric":"Weeks"}'::jsonb
  ),
  (
    630,
    'Chorizo',
    'fresh',
    10,
    'fresh chorizo,chorizo',
    2,
    'refrigerated',
    '{"min":1,"max":2,"metric":"Days"}'::jsonb
  ),
  (
    638,
    'Bratwurst',
    'fresh',
    10,
    'fresh brautwurst,brautwurst,fresh',
    3,
    'refrigerated',
    '{"min":2,"max":3,"metric":"Days"}'::jsonb
  ),
  (
    640,
    'Edamame',
    'fresh',
    19,
    'edamame,fresh,fresh edamame,soybeans,soybean',
    5,
    'refrigerated',
    '{"min":4,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    661,
    'Celery root',
    NULL,
    19,
    'celeriac,celery root,celery',
    7,
    'refrigerated',
    '{"min":1,"max":1,"metric":"Weeks"}'::jsonb
  ),
  (
    674,
    'Radicchio',
    NULL,
    19,
    'radicchio',
    18,
    'refrigerated',
    '{"min":2,"max":3,"metric":"Weeks"}'::jsonb
  ),
  (
    677,
    'Ham ',
    'uncured, fresh, uncooked',
    10,
    'ham,uncured,fresh,uncooked,uncured ham,uncured ham uncooked',
    4,
    'refrigerated',
    '{"min":3,"max":5,"metric":"Days"}'::jsonb
  ),
  (
    678,
    'Arugula',
    NULL,
    19,
    'arugula,greens,salad greens,salad',
    5,
    'refrigerated',
    '{"min":3,"max":7,"metric":"Days"}'::jsonb
  );

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Note: product_types uses INTEGER PRIMARY KEY (no auto-sequence)
-- IDs are predefined from USDA database

-- Verify count
SELECT COUNT(*) as product_types_count FROM product_types;
