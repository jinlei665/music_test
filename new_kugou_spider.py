import requests
import re
from bs4 import BeautifulSoup
import time
from dbcomn import MysqlUtil
import os

# 模拟浏览器请求头
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
}

def get_response(url):
    """发送HTTP请求并返回响应内容"""
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.encoding = 'utf-8'
        return response.text
    except Exception as e:
        print(f"请求失败: {str(e)}")
        return None

def get_all_ranks():
    """
    提取热门榜单、特色音乐榜、全球榜单的所有榜单信息
    返回：列表，每个元素格式 (rank_id, rank_name, rank_url)
    """
    base_url = "https://www.kugou.com/yy/html/rank.html"
    html = get_response(base_url)
    if not html:
        return []
    
    soup = BeautifulSoup(html, 'html.parser')
    all_ranks = []
    
    # 定位榜单区域
    rank_containers = soup.select('div.pc_rank_sidebar')
    
    for container in rank_containers:
        # 提取每个榜单的a标签
        for li in container.select('ul li'):
            a_tag = li.find('a')
            if not a_tag:
                continue
            # 提取榜单名称
            rank_name = a_tag.get('title', a_tag.text.strip())
            # 提取榜单URL
            href = a_tag.get('href', '')
            if not href:
                continue
            # 提取榜单ID
            match = re.search(r'1-(\d+)\.html', href)
            if not match:
                continue
            rank_id = match.group(1)
            # 构建完整的榜单URL
            rank_url = f"https://www.kugou.com{href}" if href.startswith('/') else href
            all_ranks.append((rank_id, rank_name, rank_url))
    
    return all_ranks

def get_song_list(rank_url):
    """
    根据榜单URL获取歌曲列表
    返回：列表，每个元素格式 (song_name, singer_name, song_url)
    """
    print(f'正在请求榜单URL: {rank_url}')
    html = get_response(rank_url)
    if not html:
        print('获取榜单HTML失败')
        return []
    
    # 直接从HTML中提取歌曲信息
    import re
    # 尝试匹配歌曲信息的正则表达式
    song_patterns = [
        r'<a.*?href="([^"]+)".*?title="([^"]+)".*?<span.*?>([^<]+)</span>',
        r'<a.*?href="([^"]+)".*?>([^<]+)</a>.*?<span.*?>([^<]+)</span>',
        r'<li.*?<a.*?href="([^"]+)".*?>([^<]+)</a>.*?<span.*?>([^<]+)</span>'
    ]
    
    song_list = []
    
    for pattern in song_patterns:
        matches = re.findall(pattern, html, re.DOTALL)
        if matches:
            for match in matches:
                song_url, song_name, singer_name = match
                # 清理字符串
                song_name = song_name.strip()
                singer_name = singer_name.strip()
                # 构建完整的URL
                if not song_url.startswith('http'):
                    song_url = f'https://www.kugou.com{song_url}'
                song_list.append((song_name, singer_name, song_url))
            break
    
    if not song_list:
        # 如果正则表达式匹配失败，尝试使用BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        # 尝试不同的选择器定位歌曲列表
        song_items = soup.select('div.pc_temp_songlist ul li') or soup.select('ul.songlist__list li') or soup.select('div.song_list ul li')
        
        print(f'找到 {len(song_items)} 首歌曲')
        
        for i, item in enumerate(song_items):
            try:
                # 提取歌曲名称和歌手
                song_info = item.select_one('a')
                if not song_info:
                    print(f'第 {i+1} 首歌曲：无法找到歌曲链接')
                    continue
                
                song_name = song_info.get('title', '').strip()
                if not song_name:
                    # 尝试从文本中提取歌曲名称
                    song_name = song_info.text.strip()
                
                if not song_name:
                    print(f'第 {i+1} 首歌曲：无法提取歌曲名称')
                    continue
                
                # 提取歌手名称
                singer_name = ''
                # 尝试不同的选择器
                singer_span = item.select_one('span') or item.select_one('div.singer') or item.select_one('span.singer')
                if singer_span:
                    singer_name = singer_span.text.strip()
                
                # 提取歌曲URL
                song_url = song_info.get('href', '')
                if not song_url:
                    print(f'第 {i+1} 首歌曲：无法提取歌曲URL')
                    continue
                
                # 构建完整的URL
                if not song_url.startswith('http'):
                    song_url = f'https://www.kugou.com{song_url}'
                
                print(f'第 {i+1} 首歌曲：{song_name} - {singer_name}')
                song_list.append((song_name, singer_name, song_url))
            except Exception as e:
                print(f'处理第 {i+1} 首歌曲时出错: {str(e)}')
                continue
    
    print(f'成功提取 {len(song_list)} 首歌曲')
    return song_list

def get_song_detail(song_url):
    """
    根据歌曲URL获取歌曲详细信息
    返回：字典，包含歌曲详细信息
    """
    print(f'正在请求歌曲URL: {song_url}')
    html = get_response(song_url)
    if not html:
        print('获取HTML失败')
        return {}
    
    # 提取歌曲ID（从URL中提取）
    song_id = ''
    # 尝试从URL中提取歌曲ID，格式如 https://www.kugou.com/mixsong/e8sq4d47.html
    song_id_match = re.search(r'/mixsong/(\w+)\.html', song_url)
    if song_id_match:
        song_id = song_id_match.group(1)
    else:
        print('无法从URL中提取歌曲ID')
    
    # 尝试从页面中提取更多信息
    soup = BeautifulSoup(html, 'html.parser')
    
    # 提取歌曲名称
    song_name = ''
    # 尝试不同的选择器
    song_name_elem = soup.select_one('h1#songName') or soup.select_one('div.song_name') or soup.select_one('h1')
    if song_name_elem:
        song_name = song_name_elem.text.strip()
        print(f'提取到歌曲名称: {song_name}')
    else:
        print('无法提取歌曲名称')
    
    # 提取歌手信息
    singer_name = ''
    # 尝试不同的选择器
    singer_elem = soup.select_one('div#singerName a') or soup.select_one('div.singer_name a') or soup.select_one('div.singer a')
    if singer_elem:
        singer_name = singer_elem.text.strip()
        print(f'提取到歌手名称: {singer_name}')
    else:
        print('无法提取歌手名称')
    
    # 提取专辑信息
    album_name = ''
    # 尝试不同的选择器
    album_elem = soup.select_one('div#albumName a') or soup.select_one('div.album_name a') or soup.select_one('div.album a')
    if album_elem:
        album_name = album_elem.text.strip()
        print(f'提取到专辑名称: {album_name}')
    else:
        print('无法提取专辑名称')
    
    # 提取歌词
    lyrics = ''
    # 尝试不同的选择器
    lyrics_elem = soup.select_one('div#lyrics') or soup.select_one('div.lyrics') or soup.select_one('div#lyric-content')
    if lyrics_elem:
        lyrics = lyrics_elem.text.strip()
        print('提取到歌词')
    else:
        print('无法提取歌词')
    
    # 提取音频链接
    audio_url = ''
    # 尝试不同的正则表达式
    audio_patterns = [
        r'"play_url":"(.*?)"',
        r'play_url\s*=\s*"(.*?)"',
        r'url\s*:\s*"(.*?)"',
        r'"audio":"(.*?)"',
        r'"mp3":"(.*?)"'
    ]
    
    for pattern in audio_patterns:
        audio_match = re.search(pattern, html)
        if audio_match:
            audio_url = audio_match.group(1).replace('\\/', '/')
            print(f'提取到音频链接: {audio_url}')
            break
    
    if not audio_url:
        print('无法提取音频链接')
    
    # 提取歌曲封面
    cover_url = ''
    # 尝试不同的正则表达式
    cover_patterns = [
        r'"img":"(.*?)"',
        r'cover\s*=\s*"(.*?)"',
        r'album_cover\s*=\s*"(.*?)"',
        r'"cover":"(.*?)"',
        r'"image":"(.*?)"'
    ]
    
    for pattern in cover_patterns:
        cover_match = re.search(pattern, html)
        if cover_match:
            cover_url = cover_match.group(1).replace('\\/', '/')
            print(f'提取到封面链接: {cover_url}')
            break
    
    if not cover_url:
        print('无法提取封面链接')
    
    # 提取歌手头像
    avatar_url = ''
    # 尝试不同的正则表达式
    avatar_patterns = [
        r'"avatar":"(.*?)"',
        r'avatar\s*=\s*"(.*?)"',
        r'singer_avatar\s*=\s*"(.*?)"',
        r'"singer_avatar":"(.*?)"',
        r'"artist_avatar":"(.*?)"'
    ]
    
    for pattern in avatar_patterns:
        avatar_match = re.search(pattern, html)
        if avatar_match:
            avatar_url = avatar_match.group(1).replace('\\/', '/')
            print(f'提取到头像链接: {avatar_url}')
            break
    
    if not avatar_url:
        print('无法提取头像链接')
    
    # 即使某些信息提取失败，也返回已提取的信息
    result = {
        'song_id': song_id,
        'song_name': song_name,
        'singer_name': singer_name,
        'album_name': album_name,
        'lyrics': lyrics,
        'song_url': song_url,
        'audio_url': audio_url,
        'cover_url': cover_url,
        'avatar_url': avatar_url
    }
    
    print(f'返回歌曲信息: {result}')
    return result

def save_files(song_data):
    """保存音频和图片文件"""
    try:
        os.makedirs('d:/kuwo/static/singing', exist_ok=True)
        os.makedirs('d:/kuwo/static/images', exist_ok=True)

        # 下载歌曲
        audio_url = song_data.get('audio_url', '')
        song_name = song_data.get('song_name', '') or song_data.get('song_id', '')
        if audio_url and song_name:
            # 清理文件名中的非法字符
            safe_song_name = re.sub(r'[\\/*?:"<>|]', '', song_name)
            audio_path = f'd:/kuwo/static/singing/{safe_song_name}.mp3'
            try:
                response = requests.get(audio_url, headers=headers, timeout=30)
                if response.status_code == 200:
                    with open(audio_path, 'wb') as f:
                        f.write(response.content)
                    print(f'歌曲下载成功: {song_name}')
                else:
                    print(f'歌曲下载失败: {song_name}, 状态码: {response.status_code}')
            except Exception as e:
                print(f'歌曲下载异常: {str(e)}')

        # 下载歌曲封面
        cover_url = song_data.get('cover_url', '')
        if cover_url and song_name:
            # 清理文件名中的非法字符
            safe_song_name = re.sub(r'[\\/*?:"<>|]', '', song_name)
            cover_path = f'd:/kuwo/static/images/{safe_song_name}_cover.jpg'
            try:
                response = requests.get(cover_url, headers=headers, timeout=30)
                if response.status_code == 200:
                    with open(cover_path, 'wb') as f:
                        f.write(response.content)
                    print(f'封面下载成功: {song_name}')
                else:
                    print(f'封面下载失败: {song_name}, 状态码: {response.status_code}')
            except Exception as e:
                print(f'封面下载异常: {str(e)}')

        # 下载歌手头像
        avatar_url = song_data.get('avatar_url', '')
        singer_name = song_data.get('singer_name', '')
        if avatar_url and singer_name:
            # 清理文件名中的非法字符
            safe_singer_name = re.sub(r'[\\/*?:"<>|]', '', singer_name)
            avatar_path = f'd:/kuwo/static/images/{safe_singer_name}_avatar.jpg'
            try:
                response = requests.get(avatar_url, headers=headers, timeout=30)
                if response.status_code == 200:
                    with open(avatar_path, 'wb') as f:
                        f.write(response.content)
                    print(f'头像下载成功: {singer_name}')
                else:
                    print(f'头像下载失败: {singer_name}, 状态码: {response.status_code}')
            except Exception as e:
                print(f'头像下载异常: {str(e)}')
        
        return True
    except Exception as e:
        print(f'文件保存失败: {str(e)}')
        return False

def process_database(song_data, rank_id, rank_name):
    """处理数据库操作"""
    try:
        mysqlutil = MysqlUtil()
        
        # 插入/更新榜单信息
        mysqlutil.adddeledit("""
            INSERT INTO rankinfo (id, name) 
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE name=VALUES(name)
        """, (rank_id, rank_name))
        
        # 提取歌手ID（使用歌曲ID作为默认值，避免为空）
        singer_name = song_data.get('singer_name', '')
        song_id = song_data.get('song_id', '')
        # 如果有歌手名称，使用其哈希值作为歌手ID；否则使用歌曲ID
        if singer_name:
            singer_id = abs(hash(singer_name)) % 1000000
        else:
            singer_id = abs(hash(song_id)) % 1000000 if song_id else 1
        
        # 构建歌手头像本地路径
        safe_singer_name = re.sub(r'[\\/*?:"<>|]', '', singer_name) if singer_name else f'unknown_{singer_id}'
        avatar_local_path = f'/static/images/{safe_singer_name}_avatar.jpg'
        
        # 插入歌手信息
        mysqlutil.adddeledit("""
            INSERT INTO singerinfo (id, singer, singerimg)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE singer=VALUES(singer), singerimg=VALUES(singerimg)
        """, (singer_id, singer_name or '未知歌手', avatar_local_path))
        
        # 构建歌曲本地路径
        song_name = song_data.get('song_name', '') or f'未知歌曲_{song_id}'
        safe_song_name = re.sub(r'[\\/*?:"<>|]', '', song_name)
        audio_local_path = f'/static/singing/{safe_song_name}.mp3'
        cover_local_path = f'/static/images/{safe_song_name}_cover.jpg'
        
        # 插入歌曲信息
        mysqlutil.adddeledit("""
            INSERT INTO singinginfo 
            (song, singerid, album, singing, img, intro, rankid)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            song_name,
            singer_id,
            song_data.get('album_name', '') or '未知专辑',
            audio_local_path,
            cover_local_path,
            song_data.get('lyrics', '') or '暂无歌词',
            rank_id
        ))
        return True
    except Exception as e:
        print(f'数据库操作失败: {str(e)}\n歌曲数据: {song_data}')
        return False

def main():
    """主函数"""
    # 获取所有榜单信息
    all_ranks = get_all_ranks()
    print(f"获取到 {len(all_ranks)} 个榜单，开始处理...")
    
    # 限制只处理前2个榜单，方便测试
    all_ranks = all_ranks[:2]
    
    # 遍历所有榜单
    for rank_id, rank_name, rank_url in all_ranks:
        try:
            print(f'正在处理榜单: {rank_name} (ID: {rank_id})')
            # 获取榜单歌曲列表
            song_list = get_song_list(rank_url)
            print(f"榜单 {rank_name} 获取到 {len(song_list)} 首歌曲，开始处理...")
            
            # 限制只处理前3首歌曲，方便测试
            song_list = song_list[:3]
            
            # 处理每首歌曲
            for song_name, singer_name, song_url in song_list:
                try:
                    print(f'正在处理歌曲: {song_name} - {singer_name}')
                    # 获取歌曲详细信息
                    song_data = get_song_detail(song_url)
                    if not song_data:
                        print(f'获取歌曲详细信息失败: {song_url}')
                        continue
                    
                    print(f'获取到歌曲详细信息: {song_data.get("song_name", "")}')
                    print(f'音频链接: {song_data.get("audio_url", "")}')
                    print(f'封面链接: {song_data.get("cover_url", "")}')
                    print(f'头像链接: {song_data.get("avatar_url", "")}')
                    
                    # 保存文件
                    print('开始保存文件...')
                    save_result = save_files(song_data)
                    print(f'文件保存结果: {save_result}')
                    
                    # 处理数据库
                    print('开始处理数据库...')
                    db_result = process_database(song_data, rank_id, rank_name)
                    print(f'数据库处理结果: {db_result}')
                    
                    # 避免请求过于频繁
                    time.sleep(2)
                except Exception as e:
                    print(f'歌曲处理失败: {str(e)}')
                    continue
        except Exception as e:
            print(f'榜单处理失败: {str(e)}')
            continue

if __name__ == '__main__':
    main()