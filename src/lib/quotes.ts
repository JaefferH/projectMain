import type { Lang } from "@/lib/i18n";

export type Quote = {
  id: string;
  arabic: string;
  text: Record<Lang, string>;
  ref: Record<Lang, string>;
};

export const knowledgeQuotes: Quote[] = [
  {
    id: "q1",
    arabic: "وَقُلْ رَبِّ زِدْنِي عِلْمًا",
    text: {
      en: "And say: My Lord, increase me in knowledge.",
      am: "እንዲህም በል፦ ጌታዬ ሆይ፣ እውቀትን ጨምርልኝ።",
      ar: "وَقُلْ رَبِّ زِدْنِي عِلْمًا",
    },
    ref: { en: "Surah Ta-Ha 20:114 — Qur'an", am: "ሱረቱ ጣሃ 20:114 — ቁርአን", ar: "سورة طه ١١٤ — القرآن الكريم" },
  },
  {
    id: "q2",
    arabic: "إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ",
    text: {
      en: "It is only those endowed with knowledge who truly fear Allah.",
      am: "ከባሮቹ አላህን በእውነት የሚፈሩት ዐዋቂዎቹ ናቸው።",
      ar: "إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ",
    },
    ref: { en: "Surah Fatir 35:28 — Qur'an", am: "ሱረቱ ፋጢር 35:28 — ቁርአን", ar: "سورة فاطر ٢٨ — القرآن الكريم" },
  },
  {
    id: "q3",
    arabic: "مَنْ سَلَكَ طَرِيقًا يَطْلُبُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ",
    text: {
      en: "Whoever treads a path seeking knowledge, Allah makes easy for him a path to Paradise.",
      am: "እውቀትን ለመፈለግ መንገድ የሚይዝ ሰው፣ አላህ ወደ ጀነት የሚወስደውን መንገድ ያቀልለታል።",
      ar: "مَنْ سَلَكَ طَرِيقًا يَطْلُبُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ",
    },
    ref: { en: "Sahih Muslim 2699 — Abu Hurayrah (RA)", am: "ሶሒሕ ሙስሊም 2699 — አቡ ሁረይራ (ረ.ዐ)", ar: "صحيح مسلم ٢٦٩٩ — أبو هريرة رضي الله عنه" },
  },
  {
    id: "q4",
    arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    text: {
      en: "The best of you are those who learn the Qur'an and teach it.",
      am: "ከእናንተ በላጩ ቁርአንን የተማረና ያስተማረ ነው።",
      ar: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    },
    ref: { en: "Sahih al-Bukhari 5027 — Uthman (RA)", am: "ሶሒሕ አል-ቡኻሪ 5027 — ዑስማን (ረ.ዐ)", ar: "صحيح البخاري ٥٠٢٧ — عثمان رضي الله عنه" },
  },
  {
    id: "q5",
    arabic: "هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ",
    text: {
      en: "Are those who know equal to those who do not know?",
      am: "የሚያውቁና የማያውቁ እኩል ይሆኑን?",
      ar: "هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ",
    },
    ref: { en: "Surah Az-Zumar 39:9 — Qur'an", am: "ሱረቱ ዙመር 39:9 — ቁርአን", ar: "سورة الزمر ٩ — القرآن الكريم" },
  },
  {
    id: "q6",
    arabic: "إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ",
    text: {
      en: "The mosques of Allah are only to be maintained by those who believe in Allah and the Last Day.",
      am: "የአላህን መስጊዶች የሚያማምሩት በአላህና በመጨረሻው ቀን ያመኑት ብቻ ናቸው።",
      ar: "إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ",
    },
    ref: { en: "Surah At-Tawbah 9:18 — Qur'an (Sacred Mosque)", am: "ሱረቱ ተውባህ 9:18 — ቁርአን (የአላህ ቤት)", ar: "سورة التوبة ١٨ — القرآن الكريم" },
  },
  {
    id: "q7",
    arabic: "فِي بُيُوتٍ أَذِنَ اللَّهُ أَن تُرْفَعَ وَيُذْكَرَ فِيهَا اسْمُهُ",
    text: {
      en: "In houses (mosques) which Allah has ordered to be raised and that His name be remembered therein.",
      am: "አላህ ከፍ እንዲሉና በውስጣቸው ስሙ እንዲወሳ በፈቀደባቸው ቤቶች (መስጊዶች) ውስጥ...",
      ar: "فِي بُيُوتٍ أَذِنَ اللَّهُ أَن تُرْفَعَ وَيُذْكَرَ فِيهَا اسْمُهُ",
    },
    ref: { en: "Surah An-Nur 24:36 — Qur'an (House of Allah)", am: "ሱረቱ ኑር 24:36 — ቁርአን (የአላህ ቤት)", ar: "سورة النور ٣٦ — القرآن الكريم" },
  },
  {
    id: "q8",
    arabic: "أَحَبُّ الْبِلَادِ إِلَى اللَّهِ مَسَاجِدُهَا",
    text: {
      en: "The most beloved of places on earth to Allah are His mosques.",
      am: "ከቦታዎች ሁሉ ለአላህ ዘንድ በጣም ተወዳጁ የመስጂድ ስፍራዎች ናቸው።",
      ar: "أَحَبُّ الْبِلَادِ إِلَى اللَّهِ مَسَاجِدُهَا",
    },
    ref: { en: "Sahih Muslim 662 — Abu Hurayrah (RA)", am: "ሶሒሕ ሙስሊም 662 — አቡ ሁረይራ (ረ.ዐ)", ar: "صحيح مسلم ٦٦٢ — أبو هريرة رضي الله عنه" },
  },
  {
    id: "q9",
    arabic: "مَنْ بَنَى مَسْجِدًا لِلَّهِ بَنَى اللَّهُ لَهُ بَيْتًا فِي الْجَنَّةِ",
    text: {
      en: "Whoever builds a mosque seeking Allah's pleasure, Allah builds for him a house in Paradise.",
      am: "የአላህን ውዴታ ፈልጎ መስጂድ የገነባ ሰው፣ አላህ በጀነት ውስጥ መሰል ቤት ይገነባለታል።",
      ar: "مَنْ بَنَى مَسْجِدًا لِلَّهِ بَنَى اللَّهُ لَهُ بَيْتًا فِي الْجَنَّةِ",
    },
    ref: { en: "Sahih al-Bukhari 450 — Uthman (RA)", am: "ሶሒሕ አል-ቡኻሪ 450 — ዑስማን (ረ.ዐ)", ar: "صحيح البخاري ٤٥٠ — عثمان رضي الله عنه" },
  },
];
