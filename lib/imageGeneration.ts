// DALL-E機能は現在無効化されています
// サーバーサイドAPIルートで使用する場合は、別ファイルに移動してください
export async function generatePatientAvatar(_scenario: {
  age?: string;
  gender?: string;
  symptoms?: string;
}): Promise<string | null> {
  // 現在はデフォルトのアバターを使用
  console.log('DALL-E generation is disabled, using default avatars');
  return null;
}

// 代替案：Unsplashから医療関係者の画像を取得
export async function getRealisticAvatar(gender: string = 'female', age: string = 'middle'): Promise<string> {
  const avatarCollections = {
    female: {
      young: [
        'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=512&h=512&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=512&h=512&fit=crop&crop=faces',
      ],
      middle: [
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=512&h=512&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=512&h=512&fit=crop&crop=faces',
      ],
      elderly: [
        'https://images.unsplash.com/photo-1551847812-f815b31ae67c?w=512&h=512&fit=crop&crop=faces',
      ]
    },
    male: {
      young: [
        'https://images.unsplash.com/photo-1612897633003-79c43bce4c15?w=512&h=512&fit=crop&crop=faces',
      ],
      middle: [
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=512&h=512&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1582233479366-6d38bc390a08?w=512&h=512&fit=crop&crop=faces',
      ],
      elderly: [
        'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=512&h=512&fit=crop&crop=faces',
      ]
    }
  };

  const genderAvatars = avatarCollections[gender as keyof typeof avatarCollections] || avatarCollections.female;
  const ageAvatars = genderAvatars[age as keyof typeof genderAvatars] || genderAvatars.middle;
  
  return ageAvatars[Math.floor(Math.random() * ageAvatars.length)];
}
