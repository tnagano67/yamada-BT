#!/usr/bin/env python3
"""年度初期登録用ダミーCSVデータ生成スクリプト"""

import csv
import io
import random

random.seed(42)

# --- 姓・名データ ---
FAMILY_NAMES = [
    ("佐藤", "サトウ", "sato"),
    ("鈴木", "スズキ", "suzuki"),
    ("高橋", "タカハシ", "takahashi"),
    ("田中", "タナカ", "tanaka"),
    ("伊藤", "イトウ", "ito"),
    ("渡辺", "ワタナベ", "watanabe"),
    ("山本", "ヤマモト", "yamamoto"),
    ("中村", "ナカムラ", "nakamura"),
    ("小林", "コバヤシ", "kobayashi"),
    ("加藤", "カトウ", "kato"),
    ("吉田", "ヨシダ", "yoshida"),
    ("山田", "ヤマダ", "yamada"),
    ("松本", "マツモト", "matsumoto"),
    ("井上", "イノウエ", "inoue"),
    ("木村", "キムラ", "kimura"),
    ("林", "ハヤシ", "hayashi"),
    ("清水", "シミズ", "shimizu"),
    ("山口", "ヤマグチ", "yamaguchi"),
    ("森", "モリ", "mori"),
    ("池田", "イケダ", "ikeda"),
    ("橋本", "ハシモト", "hashimoto"),
    ("阿部", "アベ", "abe"),
    ("石川", "イシカワ", "ishikawa"),
    ("山崎", "ヤマザキ", "yamazaki"),
    ("中島", "ナカジマ", "nakajima"),
    ("藤田", "フジタ", "fujita"),
    ("前田", "マエダ", "maeda"),
    ("小川", "オガワ", "ogawa"),
    ("岡田", "オカダ", "okada"),
    ("後藤", "ゴトウ", "goto"),
    ("長谷川", "ハセガワ", "hasegawa"),
    ("石田", "イシダ", "ishida"),
    ("村上", "ムラカミ", "murakami"),
    ("近藤", "コンドウ", "kondo"),
    ("坂本", "サカモト", "sakamoto"),
    ("遠藤", "エンドウ", "endo"),
    ("青木", "アオキ", "aoki"),
    ("藤井", "フジイ", "fujii"),
    ("西村", "ニシムラ", "nishimura"),
    ("福田", "フクダ", "fukuda"),
    ("太田", "オオタ", "ota"),
    ("三浦", "ミウラ", "miura"),
    ("藤原", "フジワラ", "fujiwara"),
    ("岡本", "オカモト", "okamoto"),
    ("松田", "マツダ", "matsuda"),
    ("中野", "ナカノ", "nakano"),
    ("原田", "ハラダ", "harada"),
    ("小野", "オノ", "ono"),
    ("田村", "タムラ", "tamura"),
    ("竹内", "タケウチ", "takeuchi"),
    ("金子", "カネコ", "kaneko"),
    ("和田", "ワダ", "wada"),
    ("中山", "ナカヤマ", "nakayama"),
    ("石井", "イシイ", "ishii"),
    ("上田", "ウエダ", "ueda"),
    ("柴田", "シバタ", "shibata"),
    ("森田", "モリタ", "morita"),
    ("原", "ハラ", "hara"),
    ("宮崎", "ミヤザキ", "miyazaki"),
    ("酒井", "サカイ", "sakai"),
    ("工藤", "クドウ", "kudo"),
    ("横山", "ヨコヤマ", "yokoyama"),
    ("宮本", "ミヤモト", "miyamoto"),
    ("内田", "ウチダ", "uchida"),
    ("高木", "タカギ", "takagi"),
    ("安藤", "アンドウ", "ando"),
    ("谷口", "タニグチ", "taniguchi"),
    ("大野", "オオノ", "ohno"),
    ("丸山", "マルヤマ", "maruyama"),
    ("今井", "イマイ", "imai"),
    ("河野", "コウノ", "kono"),
    ("藤本", "フジモト", "fujimoto"),
    ("杉山", "スギヤマ", "sugiyama"),
    ("村田", "ムラタ", "murata"),
    ("菅原", "スガワラ", "sugawara"),
    ("久保", "クボ", "kubo"),
    ("平野", "ヒラノ", "hirano"),
    ("野口", "ノグチ", "noguchi"),
    ("松井", "マツイ", "matsui"),
    ("千葉", "チバ", "chiba"),
    ("野村", "ノムラ", "nomura"),
    ("菊地", "キクチ", "kikuchi"),
    ("木下", "キノシタ", "kinoshita"),
    ("佐々木", "ササキ", "sasaki"),
    ("松尾", "マツオ", "matsuo"),
    ("杉本", "スギモト", "sugimoto"),
]

MALE_GIVEN_NAMES = [
    ("太郎", "タロウ", "taro"),
    ("一郎", "イチロウ", "ichiro"),
    ("健太", "ケンタ", "kenta"),
    ("大輔", "ダイスケ", "daisuke"),
    ("翔太", "ショウタ", "shota"),
    ("拓海", "タクミ", "takumi"),
    ("勇気", "ユウキ", "yuuki"),
    ("慎一", "シンイチ", "shinichi"),
    ("和也", "カズヤ", "kazuya"),
    ("正樹", "マサキ", "masaki"),
    ("太一", "タイチ", "taichi"),
    ("浩二", "コウジ", "koji"),
    ("隆", "タカシ", "takashi"),
    ("誠", "マコト", "makoto"),
    ("直人", "ナオト", "naoto"),
    ("悠太", "ユウタ", "yuta"),
    ("大地", "ダイチ", "daichi"),
    ("颯太", "ソウタ", "sota"),
    ("蓮", "レン", "ren"),
    ("陽翔", "ハルト", "haruto"),
    ("悠斗", "ユウト", "yuto"),
    ("陸", "リク", "riku"),
    ("湊", "ミナト", "minato"),
    ("樹", "イツキ", "itsuki"),
    ("朝陽", "アサヒ", "asahi"),
    ("結翔", "ユイト", "yuito"),
    ("蒼", "アオイ", "aoi"),
    ("律", "リツ", "ritsu"),
    ("新", "アラタ", "arata"),
    ("暖", "ダン", "dan"),
    ("奏太", "ソウタ", "souta"),
    ("大翔", "ヒロト", "hiroto"),
    ("海斗", "カイト", "kaito"),
    ("龍生", "リュウセイ", "ryusei"),
    ("瑛太", "エイタ", "eita"),
    ("光", "ヒカル", "hikaru"),
    ("優", "ユウ", "yu"),
    ("航", "ワタル", "wataru"),
    ("駿", "シュン", "shun"),
    ("裕也", "ユウヤ", "yuya"),
]

FEMALE_GIVEN_NAMES = [
    ("美咲", "ミサキ", "misaki"),
    ("裕子", "ユウコ", "yuko"),
    ("直美", "ナオミ", "naomi"),
    ("あゆみ", "アユミ", "ayumi"),
    ("千尋", "チヒロ", "chihiro"),
    ("さくら", "サクラ", "sakura"),
    ("由紀", "ユキ", "yuki"),
    ("恵子", "ケイコ", "keiko"),
    ("真由美", "マユミ", "mayumi"),
    ("綾香", "アヤカ", "ayaka"),
    ("花子", "ハナコ", "hanako"),
    ("陽菜", "ヒナ", "hina"),
    ("凛", "リン", "rin"),
    ("結衣", "ユイ", "yui"),
    ("葵", "アオイ", "aoi"),
    ("芽依", "メイ", "mei"),
    ("紬", "ツムギ", "tsumugi"),
    ("心春", "コハル", "koharu"),
    ("杏", "アン", "an"),
    ("莉子", "リコ", "riko"),
    ("詩", "ウタ", "uta"),
    ("楓", "カエデ", "kaede"),
    ("美月", "ミツキ", "mitsuki"),
    ("咲良", "サクラ", "sakura"),
    ("結菜", "ユウナ", "yuna"),
    ("琴音", "コトネ", "kotone"),
    ("朱里", "アカリ", "akari"),
    ("彩花", "アヤカ", "ayaka"),
    ("日和", "ヒヨリ", "hiyori"),
    ("七海", "ナナミ", "nanami"),
    ("美羽", "ミウ", "miu"),
    ("愛", "アイ", "ai"),
    ("真央", "マオ", "mao"),
    ("遥", "ハルカ", "haruka"),
    ("未来", "ミライ", "mirai"),
    ("彩", "アヤ", "aya"),
    ("萌", "モエ", "moe"),
    ("奈々", "ナナ", "nana"),
    ("優花", "ユウカ", "yuka"),
    ("香織", "カオリ", "kaori"),
]

ALL_GIVEN_NAMES = MALE_GIVEN_NAMES + FEMALE_GIVEN_NAMES


def generate_unique_name(used_emails: set, family, given, domain):
    """一意なメールアドレスを生成"""
    base_email = f"{family[2]}.{given[2]}@{domain}"
    email = base_email
    counter = 1
    while email in used_emails:
        email = f"{family[2]}.{given[2]}{counter}@{domain}"
        counter += 1
    used_emails.add(email)
    return email


def generate_teachers(n=60):
    """教員データ生成"""
    teachers = []
    used_emails = set()

    # ロール配分: 管理者3名、教科主任3名、教員54名
    roles = ["管理者"] * 3 + ["教科主任"] * 3 + ["教員"] * 54

    families = random.sample(FAMILY_NAMES, min(n, len(FAMILY_NAMES)))
    if len(families) < n:
        families = families + random.choices(FAMILY_NAMES, k=n - len(families))

    for i in range(n):
        family = families[i]
        # 男女交互に
        if i % 2 == 0:
            given = random.choice(MALE_GIVEN_NAMES)
        else:
            given = random.choice(FEMALE_GIVEN_NAMES)

        email = generate_unique_name(used_emails, family, given, "school.example.com")
        name = f"{family[0]} {given[0]}"
        name_kana = f"{family[1]} {given[1]}"

        teachers.append({
            "氏名": name,
            "氏名カナ": name_kana,
            "メールアドレス": email,
            "ロール": roles[i],
        })

    return teachers


def generate_classes(teachers):
    """クラスデータ生成（3学年×9組=27クラス）"""
    classes = []
    # 教員ロールの教員からランダムに27名を担任として割り当て
    teacher_pool = [t for t in teachers if t["ロール"] == "教員"]
    homeroom_teachers = random.sample(teacher_pool, 27)

    idx = 0
    for grade in range(1, 4):
        for section in range(1, 10):
            classes.append({
                "学年": grade,
                "組": str(section),
                "担任メールアドレス": homeroom_teachers[idx]["メールアドレス"],
            })
            idx += 1

    return classes


def generate_students(n_per_class=40):
    """生徒データ生成（27クラス×40名=1080名）"""
    students = []
    used_emails = set()

    for grade in range(1, 4):
        for section in range(1, 10):
            for num in range(1, n_per_class + 1):
                family = random.choice(FAMILY_NAMES)
                given = random.choice(ALL_GIVEN_NAMES)
                email = generate_unique_name(
                    used_emails, family, given, "student.school.example.com"
                )

                students.append({
                    "学年": grade,
                    "組": str(section),
                    "出席番号": num,
                    "氏名": f"{family[0]} {given[0]}",
                    "氏名カナ": f"{family[1]} {given[1]}",
                    "Googleメールアドレス": email,
                })

    return students


def write_csv(filepath, data, fieldnames):
    """CSVファイル書き出し"""
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    print(f"  {filepath} ({len(data)}件)")


def main():
    print("ダミーCSVデータを生成中...")

    base_dir = "/Users/nagano_takashi/dev/claude-code/yamada-BT/prisma/seeds"

    # 教員データ
    teachers = generate_teachers(60)
    write_csv(
        f"{base_dir}/teachers.csv",
        teachers,
        ["氏名", "氏名カナ", "メールアドレス", "ロール"],
    )

    # クラスデータ
    classes = generate_classes(teachers)
    write_csv(
        f"{base_dir}/classes.csv",
        classes,
        ["学年", "組", "担任メールアドレス"],
    )

    # 生徒データ
    students = generate_students(40)
    write_csv(
        f"{base_dir}/students.csv",
        students,
        ["学年", "組", "出席番号", "氏名", "氏名カナ", "Googleメールアドレス"],
    )

    print("完了!")
    print(f"  教員: {len(teachers)}名 (管理者3, 教科主任3, 教員54)")
    print(f"  クラス: {len(classes)}件 (3学年×9組)")
    print(f"  生徒: {len(students)}名 (27クラス×40名)")


if __name__ == "__main__":
    main()
