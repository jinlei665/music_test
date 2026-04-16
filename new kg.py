import hashlib
import time
import requests
import re
from bs4 import BeautifulSoup
from dbcomn import MysqlUtil  # 新增：导入数据库工具

def getSing(NowTime, AudioId):
    """加密参数"""
    s = [
    "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt",
    "appid=1014",
    f"clienttime={NowTime}",
    "clientver=20000",
    "dfid=3Mm3qu19Oc0w2uBmuV1jWWLQ",
    f"encode_album_audio_id={AudioId}",
    "mid=89cd50be7b00716727d8ae4bad27f96a",
    "platid=4",
    "srcappid=2919",
    "token=ec4fd3081311ad2888ba918f69e83f102955209ca0ef4e30f4edf884448b7f00",
    "userid=1403991200",
    "uuid=89cd50be7b00716727d8ae4bad27f96a",
    "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt"
]
    #把列表合并成字符串
    string=''.join(s)
    #使用md5加密
    sign=hashlib.md5(string.encode('utf-8')).hexdigest()
    #返回加密值
    return sign
def getresponse(url,params=None):
    """发送请求"""
    #模拟浏览器
    headers={
    'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0',
    'cookie':'kg_mid=89cd50be7b00716727d8ae4bad27f96a; kg_dfid=3Mm3qu19Oc0w2uBmuV1jWWLQ; kg_dfid_collect=d41d8cd98f00b204e9800998ecf8427e; Hm_lvt_aedee6983d4cfc62f509129360d6bb3d=1747489544,1747837080,1748142670; HMACCOUNT=51247CC4845F3EAD; KuGoo=KugooID=1403991200&KugooPwd=F3D8AF8234A183CB94FFCDE4FC872F57&NickName=%u8fb9%u8def%u6d77%u795e&Pic=http://imge.kugou.com/kugouicon/165/20220505/20220505150426188426.jpg&RegState=1&RegFrom=&t=ec4fd3081311ad2888ba918f69e83f102955209ca0ef4e30f4edf884448b7f00&a_id=1014&ct=1748156136&UserName=%u006b%u0067%u006f%u0070%u0065%u006e%u0031%u0034%u0030%u0033%u0039%u0039%u0031%u0032%u0030%u0030&t1=; KugooID=1403991200; t=ec4fd3081311ad2888ba918f69e83f102955209ca0ef4e30f4edf884448b7f00; a_id=1014; UserName=kgopen1403991200; mid=89cd50be7b00716727d8ae4bad27f96a; dfid=3Mm3qu19Oc0w2uBmuV1jWWLQ; Hm_lpvt_aedee6983d4cfc62f509129360d6bb3d=1748172608'
    }
    #发送请求
    response=requests.get(url,params=params,headers=headers)
    #返回响应对象
    return response

def get_all_ranks():
    """
    提取热门榜单、特色音乐榜、全球榜单的所有榜单信息
    返回：列表，每个元素格式 (rank_id, rank_name)
    """
    base_url = "https://www.kugou.com/yy/rank/home/"
    html = getresponse(base_url).text
    soup = BeautifulSoup(html, 'html.parser')
    
    # 定位三个榜单区域（热门、特色、全球）
    rank_containers = soup.select('div.pc_temp_side > div.pc_rank_sidebar')
    all_ranks = []
    
    for container in rank_containers:
        # 提取每个榜单的a标签
        for li in container.select('ul li'):
            a_tag = li.find('a')
            if not a_tag:
                continue
            # 提取榜单名称（title属性）
            rank_name = a_tag.get('title', '')
            # 提取榜单ID（从href中解析，格式如 1-8888.html）
            href = a_tag.get('href', '')
            match = re.search(r'1-(\d+)\.html', href)
            if not match:
                continue
            rank_id = match.group(1)
            all_ranks.append((rank_id, rank_name))
    
    return all_ranks

def getMusic(AudioId):
    """获取歌曲信息"""
    #歌曲数据包地址
    info_url='https://wwwapi.kugou.com/play/songinfo'
    #获取当前时间错
    c_time =  int(time.time()*1000)
    #获取加密参数
    signature= getSing(c_time,AudioId)
    #查询参数
    params={
    "srcappid": "2919",
    "clientver": "20000",
    "clienttime": c_time,
    "mid": "89cd50be7b00716727d8ae4bad27f96a",
    "uuid": "89cd50be7b00716727d8ae4bad27f96a",
    "dfid": "3Mm3qu19Oc0w2uBmuV1jWWLQ",
    "appid": "1014",
    "platid": "4",
    "encode_album_audio_id": AudioId,
    "token": "ec4fd3081311ad2888ba918f69e83f102955209ca0ef4e30f4edf884448b7f00",
    "userid": "1403991200",
    "signature": signature
    }
    #调用发送请求函数，响应json数据
    json_data=getresponse(info_url,params).json()
    """解析数据"""
    #提取歌名
    song_name=json_data['data']['song_name'].replace("'", "").replace('"', "").replace('\\', "")
    #提取歌手
    author_name=json_data['data']['author_name'].replace("'", "").replace('"', "").replace('\\', "")
    #提取歌手图片
    author_img=json_data['data']['authors'][-1]['avatar'].replace("'", "").replace('"', "")
    #提取歌手id
    singer_id=json_data['data']['authors'][-1]['author_id']
    #提取专辑
    album_name=json_data['data']['album_name'].replace("'", "").replace('"', "").replace('\\', "")
    #提取歌词
    lyrics=json_data['data']['lyrics'].replace("'", "").replace('"', "").replace('\\', "")
    #提取歌曲图片
    img =  json_data['data']['img'].replace("'", "").replace('"', "")
    #提取歌曲链接
    play_url=json_data['data']['play_url']
    # print(album_name,author_name,author_img,singer_id,album_name,lyrics,img,play_url)
    #返回数据
    return {
        'song_name': song_name,
        'play_url': play_url,
        'img_url': img,
        'author_name': author_name,
        'author_id': singer_id,
        'author_img': author_img,
        'album_name': album_name,
        'lyrics': lyrics
    }


def save_files(song_data):
    """保存音频和图片文件"""
    try:
        os.makedirs('d:/kuwo/static/singing', exist_ok=True)
        os.makedirs('d:/kuwo/static/images', exist_ok=True)

        # 保存音频
        music_content = getresponse(song_data['play_url']).content
        with open(f'd:/kuwo/static/singing/{song_data["song_name"]}.mp3', 'wb') as f:
            f.write(music_content)

        # 保存歌曲封面
        img_content = getresponse(song_data['img_url']).content
        with open(f'd:/kuwo/static/images/{song_data["song_name"]}_cover.jpg', 'wb') as f:
            f.write(img_content)

        # 保存歌手头像
        author_img_content = getresponse(song_data['author_img']).content
        with open(f'd:/kuwo/static/images/{song_data["author_name"]}_avatar.jpg', 'wb') as f:
            f.write(author_img_content)
        return True
    except Exception as e:
        print(f'文件保存失败: {str(e)}')
        return False

def get_all_rank_ids():
    """从本地HTML文件获取所有榜单ID"""
    from bs4 import BeautifulSoup
    with open('d:/kuwo/kugou_rank.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    
    rank_ids = []
    # 增强选择器定位所有榜单链接
    selectors = [
        'div.pc_rank_sidebar ul li a',
        'div.pc_temp_side ul li a',
        'div.pc_temp_side div ul li a'
    ]
    
    for selector in selectors:
        for a in soup.select(selector):
            href = a.get('href')
            if href and '/yy/rank/home/1-' in href:
                rank_id = href.split('/yy/rank/home/1-')[1].split('.')[0]
                rank_ids.append(rank_id)
    
    return list(set(rank_ids))


def getranklist(rank_id):
    """根据榜单ID获取歌曲列表"""
    list_url = f'https://www.kugou.com/yy/rank/home/1-{rank_id}.html?from=rank'
    html = getresponse(list_url).text
    return re.findall('data-eid="(.*?)">', html)


def process_database(song_data, rank_id):
    """处理数据库操作"""
    try:
        mysqlutil = MysqlUtil()
        
        # 插入/更新榜单信息
        rank_name = '当前榜单'  # 暂时使用固定名称，后续可从HTML获取
        mysqlutil.adddeledit("""
            INSERT INTO rankinfo (id, name) 
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE name=VALUES(name)
        """, (rank_id, rank_name))
        
        # 插入歌手信息
        mysqlutil.adddeledit("""
            INSERT INTO singerinfo (id, singer, singerimg)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE singer=VALUES(singer), singerimg=VALUES(singerimg)
        """, (song_data['author_id'], song_data['author_name'], song_data['author_img']))
        
        # 插入歌曲信息
        mysqlutil.adddeledit("""
            INSERT INTO singinginfo 
            (song, singerid, album, singing, img, intro, rankid)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            song_data['song_name'],
            song_data['author_id'],
            song_data['album_name'],
            f'/static/singing/{song_data["song_name"]}.mp3',
            f'/static/images/{song_data["song_name"]}_cover.jpg',
            song_data['lyrics'],
            rank_id
        ))
        return True
    except Exception as e:
        print(f'数据库操作失败: {str(e)}\n歌曲数据: {song_data}')
        return False

if __name__ == '__main__':
    # 使用改进的获取榜单ID方法
    all_rank_ids = get_all_rank_ids()
    
    # 遍历所有榜单
    for rank_id in all_rank_ids:
        try:
            print(f'正在处理榜单: {rank_id}')
            audio_ids = getranklist(rank_id)
            
            # 处理每首歌曲
            for audio_id in audio_ids:
                try:
                    song_data = getMusic(audio_id)
                    if save_files(song_data) and process_database(song_data, rank_id):
                        print(f'{song_data["song_name"]} 处理成功')
                except Exception as e:
                    print(f'歌曲处理失败: {str(e)}')
        except Exception as e:
            print(f'榜单处理失败: {str(e)}')

# 保持原有保存函数（仅修正变量名）
def Save(song_name, durl):
    """保存歌曲到F:/music"""
    music_content = getresponse(durl).content
    # 注意：原代码中使用 song_name 而非 name（已修正）
    with open(f'F:/music/{song_name}.mp3', 'wb') as f:
        f.write(music_content)

# 主函数修改：多榜单处理 + 数据库插入
if __name__ == '__main__':
    # 初始化数据库工具
    mysql = MysqlUtil()
    
    # 1. 获取所有榜单信息
    all_ranks = get_all_ranks()
    print(f"获取到 {len(all_ranks)} 个榜单，开始处理...")
    
    for rank_id, rank_name in all_ranks:
        # 2. 插入榜单信息到rankinfo表（使用INSERT IGNORE避免重复）
        insert_rank_sql = f"""
            INSERT IGNORE INTO rankinfo (id, name) 
            VALUES ({rank_id}, '{rank_name.replace("'", "''")}')
        """
        mysql.adddeledit(insert_rank_sql)
        print(f"榜单 {rank_name} (ID:{rank_id}) 插入成功")
        
        # 3. 获取当前榜单的歌曲列表（原getranklist逻辑）
        list_url = f'https://www.kugou.com/yy/rank/home/{rank_id}.html?from=rank'
        html = getresponse(list_url).text
        audio_ids = re.findall(r'data-eid="(\d+)"', html)
        print(f"榜单 {rank_name} 获取到 {len(audio_ids)} 首歌曲，开始下载...")
        
        # 4. 处理每首歌曲
        for audio_id in set(audio_ids):  # 去重
            try:
                # 获取歌曲详细信息（扩展后返回值）
                song_name, play_url, author_name, singer_id, album_name, lyrics, img = getMusic(audio_id)
                
                # 5. 插入歌手信息到singerinfo表
                insert_singer_sql = f"""
                    INSERT IGNORE INTO singerinfo (id, singer, singerimg) 
                    VALUES ({singer_id}, '{author_name.replace("'", "''")}', '{img.replace("'", "''")}')
                """
                mysql.adddeledit(insert_singer_sql)
                
                # 6. 插入歌曲信息到singinginfo表（字段与kuwo.sql一致）
                insert_song_sql = f"""
                    INSERT INTO singinginfo (song, album, singing, img, intro, singerid, rankid) 
                    VALUES (
                        '{song_name.replace("'", "''")}', 
                        '{album_name.replace("'", "''")}', 
                        '{play_url.replace("'", "''")}', 
                        '{img.replace("'", "''")}', 
                        '{lyrics.replace("'", "''")}', 
                        {singer_id}, 
                        {rank_id}
                    )
                """
                mysql.adddeledit(insert_song_sql)
                
                # 7. 保存歌曲文件（保持原有逻辑）
                Save(song_name, play_url)
                print(f"歌曲 {song_name} 下载并入库成功")
                
            except Exception as e:
                print(f"处理歌曲 {audio_id} 失败：{str(e)}")
                continue
    
    # 关闭数据库连接（dbcomn自动关闭，此处可省略）
    mysql.con.close()