#导入哈模块
import hashlib
import time
import requests
#导入正则表达式模块
import re
import os
from dbcomn import MysqlUtil
#加密参数
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
    """保存音频和图片文件（修改下载路径为 F:/music/）"""
    try:
        # 修改：创建 F:/music 目录（原 d:/kuwo/static/singing 改为 F:/music）
        os.makedirs('F:/music', exist_ok=True)  # 仅需创建音乐存储目录
        os.makedirs('d:/kuwo/static/images', exist_ok=True)  # 图片路径保持原有需求（若无需可删除）

        # 修改：音频文件保存到 F:/music/
        music_content = getresponse(song_data['play_url']).content
        with open(f'F:/music/{song_data["song_name"]}.mp3', 'wb') as f:  # 路径修改关键行
            f.write(music_content)

        # 图片保存逻辑（若无需可注释，用户未明确要求修改，保留原有路径）
        img_content = getresponse(song_data['img_url']).content
        with open(f'd:/kuwo/static/images/{song_data["song_name"]}_cover.jpg', 'wb') as f:
            f.write(img_content)

        author_img_content = getresponse(song_data['author_img']).content
        safe_song_name = re.sub(r'[\\/*?:"<>|]', '', song_data["song_name"])
        avatar_path = f'd:/kuwo/static/images/头像_{safe_song_name}.jpg'
        with open(avatar_path, 'wb') as f:
            f.write(author_img_content)
        
        return {'save_success': True}  # 简化返回（无需数据库路径）
    except Exception as e:
        print(f'文件保存失败: {str(e)}')
        return {'save_success': False}

def process_database(song_data, rank_id, avatar_local_path):
    """处理数据库操作（注释所有数据库存储逻辑）"""
    try:
        mysqlutil = MysqlUtil()
        
        # 注释：暂停榜单信息插入
        # mysqlutil.adddeledit("""
        #     INSERT INTO rankinfo (id, name) 
        #     VALUES (%s, %s)
        #     ON DUPLICATE KEY UPDATE name=VALUES(name)
        # """, (rank_id, rank_name))
        
        # 注释：暂停歌手信息插入
        # mysqlutil.adddeledit("""
        #     INSERT INTO singerinfo (id, singer, singerimg)
        #     VALUES (%s, %s, %s)
        #     ON DUPLICATE KEY UPDATE singer=VALUES(singer), singerimg=VALUES(singerimg)
        # """, (song_data['author_id'], song_data['author_name'], avatar_local_path))
        
        # 注释：暂停歌曲信息插入
        # mysqlutil.adddeledit("""
        #     INSERT INTO singinginfo 
        #     (song, singerid, album, singing, img, intro, rankid)
        #     VALUES (%s, %s, %s, %s, %s, %s, %s)
        # """, (
        #     song_data['song_name'],
        #     song_data['author_id'],
        #     song_data['album_name'],
        #     f'/static/singing/{song_data["song_name"]}.mp3',
        #     f'/static/images/{song_data["song_name"]}_cover.jpg',
        #     song_data['lyrics'],
        #     rank_id
        # ))
        return True  # 保持逻辑完整性（实际不执行数据库操作）
    except Exception as e:
        print(f'数据库操作失败: {str(e)}\n歌曲数据: {song_data}')
        return False

def get_all_rank_ids():
    """从本地HTML文件获取所有榜单ID（仅处理ID≥31313的榜单）"""
    from bs4 import BeautifulSoup
    with open('d:/kuwo/kugou_rank.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    
    rank_ids = []
    selectors = [
        'div.pc_rank_sidebar ul li a',
        'div.pc_temp_side ul li a',
        'div.pc_temp_side div ul li a'
    ]
    
    for selector in selectors:
        for a in soup.select(selector):
            href = a.get('href')
            if href and '/yy/rank/home/1-' in href:
                # 提取rank_id并转换为整数
                raw_rank_id = href.split('/yy/rank/home/1-')[1].split('.')[0]
                try:
                    rank_id = int(raw_rank_id)
                    # 仅保留ID≥31313的榜单
                    if rank_id >= 31313:
                        rank_ids.append(str(rank_id))  # 保持字符串格式供后续使用
                except ValueError:
                    print(f"无效的榜单ID: {raw_rank_id}，已跳过")
                    continue  # 跳过无法转换为整数的ID
    
    return list(set(rank_ids))  # 去重并返回

def getranklist(rank_id):
    """根据榜单ID获取歌曲列表"""
    list_url = f'https://www.kugou.com/yy/rank/home/1-{rank_id}.html?from=rank'
    html = getresponse(list_url).text
    return re.findall('data-eid="(.*?)">', html)

# 主函数（仅修改榜单 ID 获取逻辑）
if __name__ == '__main__':
    # 直接指定仅处理榜单 ID 为 37361（替换原有 get_all_rank_ids() 逻辑）
    all_rank_ids = ['37361']  # 仅爬取 ID 为 37361 的榜单
    
    for rank_id in all_rank_ids:
        try:
            print(f'正在处理榜单 ID: {rank_id}')
            audio_ids = getranklist(rank_id)  # 获取该榜单的歌曲 ID 列表
            
            for audio_id in audio_ids:
                try:
                    song_data = getMusic(audio_id)
                    save_result = save_files(song_data)
                    if not save_result['save_success']:
                        continue
                    # 注释：暂停调用数据库处理
                    # if process_database(song_data, rank_id, save_result.get('avatar_local_path')):
                    print(f'{song_data["song_name"]} 下载成功（已保存到 F:/music/）')  # 调整提示信息
                    time.sleep(5)
                except Exception as e:
                    print(f'歌曲处理失败: {str(e)}')
        except Exception as e:
            print(f'榜单处理失败: {str(e)}')