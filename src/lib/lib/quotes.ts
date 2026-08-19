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
];
