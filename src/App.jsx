import React, { useState, useEffect } from 'react';

export default function AdvancedTextAnalyzer() {
  const [text, setText] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [improveError, setImproveError] = useState('');
  const [platform, setPlatform] = useState('genel');
  const [audienceType, setAudienceType] = useState('genel');
  const [toneStyle, setToneStyle] = useState('genel');
  const [language, setLanguage] = useState('tr');
  const [compareMode, setCompareMode] = useState(false);
  const [comparePlatforms] = useState(['gazete', 'haber', 'blog', 'twitter', 'instagram', 'linkedin', 'facebook']);
  const [suggestionsSource, setSuggestionsSource] = useState('template');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  const [metrics, setMetrics] = useState(emptyMetricsObj());
  const [improvedMetrics, setImprovedMetrics] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState({ headlines: [], metaDescription: '', hashtags: [] });

  const platforms = {
    genel: { name: 'Genel', color: '#9E9E9E', icon: '📄' },
    gazete: { name: 'Gazete', color: '#607D8B', icon: '📰' },
    haber: { name: 'Haber Portalı', color: '#F44336', icon: '📱' },
    blog: { name: 'Blog/Dergi', color: '#9C27B0', icon: '📝' },
    twitter: { name: 'Twitter/X', color: '#1DA1F2', icon: '𝕏' },
    instagram: { name: 'Instagram', color: '#E4405F', icon: '📸' },
    linkedin: { name: 'LinkedIn', color: '#0077B5', icon: '💼' },
    facebook: { name: 'Facebook', color: '#1877F2', icon: '👥' }
  };

  const audienceTypes = {
    genel: { name: 'Genel Kitle', icon: '👥' },
    spesifik: { name: 'Spesifik Kitle', icon: '🎯' }
  };

  const toneStyles = {
    genel: { name: 'Genel', icon: '📝', desc: 'Ton seçimi yok, genel analiz' },
    kurumsal: { name: 'Kurumsal', icon: '🏢', desc: 'Resmi, profesyonel, mesafeli' },
    samimi: { name: 'Samimi', icon: '🤝', desc: 'Arkadaşça, sıcak, yakın' },
    akademik: { name: 'Akademik', icon: '🎓', desc: 'Bilimsel, analitik, nesnel' },
    haberci: { name: 'Haberci', icon: '📰', desc: 'Tarafsız, bilgilendirici, net' },
    pazarlama: { name: 'Pazarlama', icon: '💰', desc: 'Satış odaklı, ikna edici' },
    egitici: { name: 'Eğitici', icon: '📚', desc: 'Açıklayıcı, yol gösterici' },
    motivasyonel: { name: 'Motivasyonel', icon: '⚡', desc: 'Motive edici, duygusal' },
    ajitatif: { name: 'Ajitatif', icon: '🔥', desc: 'Provokatif, keskin, harekete geçirici' }
  };

  const countSyllables = (word) => {
    const matches = word.toLowerCase().match(/[aeıioöuüâîû]/g);
    return matches ? matches.length : 0;
  };

  const countEnglishSyllables = (word) => {
    let w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (w.length === 0) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    w = w.replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
  };

  const passiveIlRegex = /(ı|i|u|ü)l(dı|di|du|dü|mış|miş|muş|müş|acak|ecek|ıyor|iyor|uyor|üyor|makta|mekte|ır|ir|ur|ür|malı|meli|amaz|emez|madı|medi|maktadır|mektedir|mıştır|miştir|muştur|müştür|ması|mesi|mak|mek)$/;
  const passiveNRegex = /(a|e|ı|i|u|ü|l)n(dı|di|du|dü|mış|miş|muş|müş|acak|ecek|ıyor|iyor|uyor|üyor|makta|mekte|ır|ir|ur|ür|maktadır|mektedir|mıştır|miştir|muştur|müştür|ması|mesi)$/;
  const abilityRegex = /(abil|ebil|abilir|ebilir|abilmek|ebilmek|abilme|ebilme)/;

  const isPassiveWord = (clean) => {
    if (!clean) return false;
    if (abilityRegex.test(clean)) return false;
    return passiveIlRegex.test(clean) || passiveNRegex.test(clean);
  };

  const detectPassiveCount = (words) => {
    let count = 0;
    words.forEach((w) => {
      const clean = w.toLowerCase().replace(/[.,!?;:"'’()]/g, '');
      if (isPassiveWord(clean)) count++;
    });
    return count;
  };

  const turkishStopwords = new Set([
    'için', 'gibi', 'daha', 'çok', 'ile', 'ama', 'fakat', 'ancak', 'veya', 'olarak',
    'olan', 'olduğu', 'şekilde', 'sonra', 'önce', 'kadar', 'göre', 'yani', 'tüm',
    'bazı', 'kendi', 'değil', 'çünkü', 'hatta', 'yine', 'artık', 'şey', 'birçok',
    'henüz', 'ayrıca', 'üzere', 'dolayı', 'rağmen', 'doğru', 'sırada'
  ]);

  const lightStem = (word) => {
    let w = word.toLowerCase().split(/['’]/)[0];
    w = w.replace(/[^a-zçğıöşü]/g, '');
    const suffixes = [
      'larında', 'lerinde', 'larından', 'lerinden', 'ların', 'lerin', 'ları', 'leri',
      'lara', 'lere', 'larda', 'lerde', 'ından', 'inden', 'undan', 'ünden',
      'ında', 'inde', 'unda', 'ünde', 'dan', 'den', 'tan', 'ten', 'nın', 'nin',
      'nun', 'nün', 'ya', 'ye', 'da', 'de', 'ta', 'te', 'la', 'le', 'yı', 'yi',
      'yu', 'yü', 'lar', 'ler', 'ın', 'in', 'un', 'ün'
    ];
    for (const suf of suffixes) {
      if (w.length > suf.length + 2 && w.endsWith(suf)) {
        w = w.slice(0, -suf.length);
        break;
      }
    }
    return w;
  };

  function emptyMetricsObj() {
    return {
      characters: 0, words: 0, sentences: 0, avgWordLength: 0, avgSentenceLength: 0,
      avgSyllables: 0, readabilityScore: 0, readabilityLevel: '',
      bezirciScore: 0, bezirciLevel: '', fleschEase: 0, fleschGrade: 0,
      toneAnalysis: { formalityScore: 0, activePassiveRatio: 0, passiveCount: 0, emotionalTone: 'nötr', addressStyle: 'belirsiz' },
      advancedAnalysis: { sentenceVariety: 0, transitionWords: 0, repeatedWords: [], conjunctionDiversity: 0, lengthDistribution: [], intensifiers: [], intensifierTotal: 0, repeatedOpeners: [] },
      seoScore: 0, platformScore: 0, engagementScore: 0, trustScore: 0
    };
  }

  // Tek doğruluk kaynağı: cümle sonu olmayan noktaları (ondalık, sıra sayısı,
  // kısaltma, üç nokta) eşit uzunlukta bir maske karakteriyle gizler, gerçek
  // cümle sınırlarını bulur ve ORİJİNAL metni aynı konumlardan dilimler.
  // Böylece hem analiz hem vurgulama aynı sınırları görür.
  const segmentSentences = (inputText) => {
    if (!inputText || !inputText.trim()) return [];
    const MASK = '\u0001';
    let t = inputText;
    t = t.replace(/(\d)\.(\d)/g, (m, a, b) => a + MASK + b);            // ondalık: 20.30
    t = t.replace(/(\d)\.(?=\s)/g, (m, a) => a + MASK);                 // sıra sayısı: 35. yıl
    t = t.replace(/M\.Ö\./g, 'M' + MASK + 'Ö' + MASK).replace(/M\.S\./g, 'M' + MASK + 'S' + MASK);
    t = t.replace(/\.{3,}/g, (m) => MASK.repeat(m.length));             // üç nokta
    const abbr = ['Dr', 'Prof', 'Doç', 'Av', 'Sn', 'vb', 'vs', 'Yrd', 'Uzm', 'No',
                  'Tel', 'Cad', 'Sok', 'Apt', 'bkz', 'age', 'çev', 'haz', 'Org',
                  'Gen', 'Müh', 'Op', 'St', 'Mah'];
    abbr.forEach((a) => {
      t = t.replace(new RegExp(`(^|[\\s(])(${a})\\.`, 'g'), (m, p1, p2) => p1 + p2 + MASK);
    });
    const segments = [];
    const re = /[.!?]+/g;
    let start = 0, m;
    while ((m = re.exec(t)) !== null) {
      const end = m.index + m[0].length;
      segments.push(inputText.slice(start, end));
      start = end;
    }
    if (start < inputText.length) segments.push(inputText.slice(start));
    return segments.filter((s) => s.trim().length > 0);
  };

  const splitSentences = (inputText) => segmentSentences(inputText).map((s) => s.trim());

  const analyzeText = (inputText) => {
    if (!inputText.trim()) return emptyMetricsObj();

    const characters = inputText.length;
    const words = inputText.trim().split(/\s+/).filter((word) => word.length > 0);
    const wordCount = words.length;
    const sentences = splitSentences(inputText);
    const sentenceCount = sentences.length;

    const totalWordLength = words.reduce((sum, word) => sum + word.replace(/[.,!?;:"']/g, '').length, 0);
    const avgWordLength = wordCount > 0 ? (totalWordLength / wordCount).toFixed(1) : 0;
    const avgSentenceLength = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(1) : 0;

    const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const avgSyllables = wordCount > 0 ? (totalSyllables / wordCount) : 0;
    let atesman = 198.825 - (40.175 * avgSyllables) - (2.610 * parseFloat(avgSentenceLength));
    let readabilityScore = Math.round(Math.max(0, Math.min(100, atesman)));
    let readabilityLevel = '';
    if (readabilityScore >= 90) readabilityLevel = 'Çok Kolay';
    else if (readabilityScore >= 70) readabilityLevel = 'Kolay';
    else if (readabilityScore >= 50) readabilityLevel = 'Orta';
    else if (readabilityScore >= 30) readabilityLevel = 'Zor';
    else readabilityLevel = 'Çok Zor';

    let c3 = 0, c4 = 0, c5 = 0, c6 = 0;
    words.forEach((w) => {
      const s = countSyllables(w);
      if (s === 3) c3++;
      else if (s === 4) c4++;
      else if (s === 5) c5++;
      else if (s >= 6) c6++;
    });
    const oks = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const H3 = sentenceCount > 0 ? c3 / sentenceCount : 0;
    const H4 = sentenceCount > 0 ? c4 / sentenceCount : 0;
    const H5 = sentenceCount > 0 ? c5 / sentenceCount : 0;
    const H6 = sentenceCount > 0 ? c6 / sentenceCount : 0;
    const yod = Math.sqrt(Math.max(0, oks * ((H3 * 0.84) + (H4 * 1.5) + (H5 * 3.5) + (H6 * 26.25))));
    const bezirciScore = yod.toFixed(1);
    let bezirciLevel = '';
    if (yod <= 8) bezirciLevel = 'İlköğretim (1–8. sınıf)';
    else if (yod <= 12) bezirciLevel = 'Lise (9–12. sınıf)';
    else if (yod <= 16) bezirciLevel = 'Lisans (üniversite)';
    else bezirciLevel = 'Akademik (16+ yıl)';

    const enSyllables = words.reduce((sum, w) => sum + countEnglishSyllables(w), 0);
    const enAvgSyll = wordCount > 0 ? enSyllables / wordCount : 0;
    const wps = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const fleschEase = Math.round(206.835 - (1.015 * wps) - (84.6 * enAvgSyll));
    const fleschGrade = (0.39 * wps + 11.8 * enAvgSyll - 15.59).toFixed(1);

    const lowerText = inputText.toLowerCase();
    const wordTokens = lowerText.match(/[a-zçğıöşü]+/g) || [];
    const countWb = (list) => wordTokens.filter((w) => list.includes(w)).length;

    const formalConnectors = ['dolayısıyla', 'neticesinde', 'itibarıyla', 'nitekim', 'zira', 'münasebetiyle', 'binaenaleyh', 'dahi', 'hususunda', 'kapsamında', 'bağlamında'];
    const informalMarkers = ['yani', 'işte', 'hani', 'falan', 'filan', 'ya', 'valla', 'aynen', 'şey', 'sanki', 'açıkçası', 'herhalde'];
    const formalConn = countWb(formalConnectors);
    const informalMark = countWb(informalMarkers);
    const formalPredicate = (lowerText.match(/(maktadır|mektedir|dır|dir|dur|dür|tır|tir|tur|tür)\b/g) || []).length;
    const longWordRatio = wordCount > 0 ? (c4 + c5 + c6) / wordCount : 0;

    let formalityScore = 50 + (formalConn * 8) + Math.min(20, formalPredicate * 4) + Math.min(20, Math.round(longWordRatio * 60)) - (informalMark * 10);
    formalityScore = Math.max(0, Math.min(100, formalityScore));

    const passiveCount = detectPassiveCount(words);
    const verbRegex = /(dı|di|du|dü|tı|ti|tu|tü|yor|acak|ecek|mış|miş|muş|müş|dır|dir|dur|dür|tır|tir|maktadır|mektedir|malı|meli|ır|ir|ur|ür)$/;
    let totalVerbs = 0;
    words.forEach((w) => {
      const clean = w.toLowerCase().replace(/[.,!?;:"'’()]/g, '');
      if (verbRegex.test(clean)) totalVerbs++;
    });
    totalVerbs = Math.max(totalVerbs, passiveCount, sentenceCount);
    const activePassiveRatio = totalVerbs > 0 ? Math.max(0, Math.min(100, Math.round((1 - passiveCount / totalVerbs) * 100))) : 100;

    const positiveWords = ['harika', 'mükemmel', 'başarılı', 'güzel', 'iyi', 'mutlu', 'sevindirici'];
    const negativeWords = ['kötü', 'başarısız', 'üzücü', 'sorun', 'problem', 'tehlikeli', 'olumsuz'];
    const positiveCount = countWb(positiveWords);
    const negativeCount = countWb(negativeWords);
    let emotionalTone = 'nötr';
    if (positiveCount > negativeCount + 1) emotionalTone = 'pozitif';
    else if (negativeCount > positiveCount + 1) emotionalTone = 'negatif';

    const sizForms = ['siz', 'sizin', 'size', 'sizi', 'sizler', 'sizden', 'sizce', 'sizdir', 'siniz'];
    const senForms = ['sen', 'senin', 'sana', 'seni', 'sende', 'sence', 'sensin'];
    let addressStyle = 'genel/nesnel';
    if (wordTokens.some((t) => sizForms.includes(t))) addressStyle = 'resmi (siz)';
    else if (wordTokens.some((t) => senForms.includes(t))) addressStyle = 'samimi (sen)';

    const transitionWords = ['ancak', 'fakat', 'ama', 'lakin', 'bununla birlikte', 'öte yandan', 'ayrıca', 'dahası', 'sonuç olarak'];
    const transitionCount = transitionWords.filter((w) => inputText.toLowerCase().includes(w)).length;

    const wordFrequency = {};
    const surfaceForms = {};
    words.forEach((word) => {
      const raw = word.toLowerCase().replace(/[^a-zçğıöşü]/g, '');
      const stem = lightStem(word);
      if (stem.length > 3 && !turkishStopwords.has(stem) && !turkishStopwords.has(raw)) {
        wordFrequency[stem] = (wordFrequency[stem] || 0) + 1;
        if (raw.length > 0) {
          if (!surfaceForms[stem]) surfaceForms[stem] = {};
          surfaceForms[stem][raw] = (surfaceForms[stem][raw] || 0) + 1;
        }
      }
    });
    const repeatedWords = Object.entries(wordFrequency)
      .filter(([w, count]) => count > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([stem, count]) => {
        // Kök yerine en sık geçen GERÇEK yüzey biçimini göster ("beledi" değil "belediye")
        const forms = surfaceForms[stem] || {};
        const best = Object.entries(forms).sort((a, b) => b[1] - a[1])[0];
        return { word: best ? best[0] : stem, count };
      });

    const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);
    const lengthVariety = new Set(sentenceLengths.map((l) => Math.floor(l / 5))).size;
    const sentenceVariety = Math.min(10, (lengthVariety / 5) * 10);

    // P1 #5 — Cümle uzunluğu dağılımı (ritim röntgeni)
    const lengthBuckets = [
      { label: '1-8', min: 1, max: 8 },
      { label: '9-15', min: 9, max: 15 },
      { label: '16-22', min: 16, max: 22 },
      { label: '23-30', min: 23, max: 30 },
      { label: '30+', min: 31, max: Infinity },
    ];
    const lengthDistribution = lengthBuckets.map((b) => ({
      label: b.label,
      count: sentenceLengths.filter((l) => l >= b.min && l <= b.max).length,
    }));

    // P1 #6a — Pekiştireç / zayıf zarf kullanımı
    const intensifierList = ['çok', 'oldukça', 'gayet', 'son derece', 'büyük ölçüde', 'adeta',
      'resmen', 'fazlasıyla', 'epey', 'hayli', 'aşırı', 'gerçekten', 'cidden', 'tamamen',
      'kesinlikle', 'iyice', 'bir hayli', 'son derece', 'müthiş', 'muazzam'];
    const lowerForIntensifiers = inputText.toLowerCase();
    const tokenSet = words.map((w) => w.toLowerCase().replace(/[^a-zçğıöşüâîû]/g, ''));
    const intensifierHits = {};
    intensifierList.forEach((term) => {
      const c = term.includes(' ')
        ? lowerForIntensifiers.split(term).length - 1
        : tokenSet.filter((t) => t === term).length;
      if (c > 0) intensifierHits[term] = (intensifierHits[term] || 0) + c;
    });
    const intensifiers = Object.entries(intensifierHits).sort((a, b) => b[1] - a[1]).map(([word, count]) => ({ word, count }));
    const intensifierTotal = intensifiers.reduce((s, i) => s + i.count, 0);

    // P1 #6b — Tekrar eden cümle başları
    const openerCounts = {};
    const openerExample = {};
    sentences.forEach((s) => {
      const toks = s.trim().split(/\s+/);
      const norm = (toks[0] || '').toLowerCase().replace(/[^a-zçğıöşüâîû]/g, '');
      if (norm.length >= 2) {
        openerCounts[norm] = (openerCounts[norm] || 0) + 1;
        if (!openerExample[norm]) openerExample[norm] = toks.slice(0, 3).join(' ').replace(/["'"'']/g, '');
      }
    });
    const repeatedOpeners = sentences.length >= 3
      ? Object.entries(openerCounts).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4)
          .map(([w, count]) => ({ phrase: openerExample[w], count }))
      : [];

    const conjunctions = ['ve', 'veya', 've ya da', 'ile', 'ancak', 'fakat', 'ama', 'çünkü', 'zira'];
    const usedConjunctions = conjunctions.filter((c) => inputText.toLowerCase().includes(c));
    const conjunctionDiversity = (usedConjunctions.length / conjunctions.length * 10).toFixed(1);

    let seoScore = 50;
    if (wordCount >= 300 && wordCount <= 2000) seoScore += 20;
    if (sentenceCount > 5) seoScore += 10;
    if (repeatedWords.length > 0) seoScore += 10;
    if (transitionCount >= 3) seoScore += 10;
    seoScore = Math.min(100, seoScore);

    const platformScore = calculatePlatformScore(platform, { characters, wordCount, sentenceCount, readabilityScore, formalityScore });
    const engagementScore = calculateEngagementScore({ emotionalTone, readabilityScore, platform, sentenceCount });
    const trustScore = calculateTrustScore({ formalityScore, activePassiveRatio, transitionCount, platform });

    return {
      characters, words: wordCount, sentences: sentenceCount, avgWordLength, avgSentenceLength,
      avgSyllables: avgSyllables.toFixed(2),
      readabilityScore, readabilityLevel,
      bezirciScore, bezirciLevel, fleschEase, fleschGrade,
      toneAnalysis: { formalityScore: Math.round(formalityScore), activePassiveRatio, passiveCount, emotionalTone, addressStyle },
      advancedAnalysis: { sentenceVariety: sentenceVariety.toFixed(1), transitionWords: transitionCount, repeatedWords, conjunctionDiversity, lengthDistribution, intensifiers, intensifierTotal, repeatedOpeners },
      seoScore, platformScore, engagementScore, trustScore
    };
  };

  const calculatePlatformScore = (platform, data) => {
    let score = 50;
    switch (platform) {
      case 'twitter':
        if (data.characters <= 280) score += 30; else score -= 20;
        if (data.sentenceCount <= 3) score += 20;
        break;
      case 'instagram':
        if (data.wordCount <= 150) score += 25;
        if (data.readabilityScore >= 70) score += 25;
        break;
      case 'linkedin':
        if (data.wordCount >= 150 && data.wordCount <= 500) score += 25;
        if (data.formalityScore >= 60) score += 25;
        break;
      case 'facebook':
        if (data.wordCount <= 250) score += 25;
        if (data.sentenceCount >= 3) score += 25;
        break;
      case 'gazete':
      case 'haber':
        if (data.wordCount >= 300) score += 20;
        if (data.formalityScore >= 50) score += 30;
        break;
      case 'blog':
        if (data.wordCount >= 500) score += 30;
        if (data.sentenceCount >= 10) score += 20;
        break;
      default:
        score = 70;
    }
    return Math.min(100, Math.max(0, score));
  };

  const calculateEngagementScore = (data) => {
    let score = 50;
    if (data.emotionalTone === 'pozitif') score += 20;
    if (data.readabilityScore >= 70) score += 20;
    if (data.platform === 'instagram' || data.platform === 'facebook') {
      if (data.sentenceCount <= 5) score += 10;
    }
    return Math.min(100, score);
  };

  const calculateTrustScore = (data) => {
    let score = 50;
    if (data.formalityScore >= 60) score += 20;
    if (data.activePassiveRatio >= 70) score += 15;
    if (data.transitionCount >= 3) score += 15;
    if (data.platform === 'gazete' || data.platform === 'haber') {
      if (data.formalityScore >= 70) score += 10;
    }
    return Math.min(100, score);
  };

  const generateTemplateSuggestions = (text, platform) => {
    const clean = text.trim().replace(/\s+/g, ' ');
    const cap = (s, n) => {
      if (s.length <= n) return s;
      let cut = s.slice(0, n);
      const lastSpace = cut.lastIndexOf(' ');
      if (lastSpace > n * 0.6) cut = cut.slice(0, lastSpace);
      return cut.trim().replace(/[.,;:!?—-]+$/, '') + '…';
    };
    const sentences = splitSentences(clean);
    const lead = (sentences[0] || clean).trim();

    const freq = {};
    (clean.toLowerCase().match(/[a-zçğıöşü]+/g) || []).forEach((w) => {
      if (w.length > 5 && !turkishStopwords.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
    const keywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
    const k0 = keywords[0] ? keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1) : '';

    const headlines = [cap(lead, 80)];
    if (platform === 'twitter') {
      headlines.push(k0 ? `${k0}: ${cap(lead, 60)}` : cap(lead, 70));
      headlines.push(`${cap(lead, 65)} 🧵`);
    } else if (platform === 'instagram') {
      headlines.push(`✨ ${cap(lead, 65)}`);
      headlines.push(`${cap(lead, 60)} 📸`);
    } else if (platform === 'linkedin') {
      headlines.push(k0 ? `${k0} üzerine: ${cap(lead, 55)}` : cap(lead, 70));
      headlines.push(cap(lead, 65));
    } else if (platform === 'gazete' || platform === 'haber') {
      headlines.push(cap(lead, 70));
      headlines.push(keywords.length >= 2 ? `${k0}, ${keywords[1]} gündemi` : cap(lead, 70));
    } else {
      headlines.push(k0 ? `${cap(lead, 55)} — ${k0}` : cap(lead, 70));
      headlines.push(cap(lead, 65));
    }
    const seen = new Set();
    const uniqueHeadlines = [];
    for (const h of headlines.filter(Boolean)) {
      const key = h.toLowerCase().replace(/[…\s🧵📸✨]/g, '').replace(/[.,;:!?—-]+$/, '');
      if (key && !seen.has(key)) { seen.add(key); uniqueHeadlines.push(h); }
      if (uniqueHeadlines.length >= 3) break;
    }

    const metaDescription = cap(clean, 150);
    const hashtags = [];
    if (['twitter', 'instagram', 'linkedin'].includes(platform)) {
      keywords.forEach((w) => hashtags.push('#' + w.charAt(0).toUpperCase() + w.slice(1)));
    }
    return { headlines: uniqueHeadlines, metaDescription, hashtags };
  };

  const generateAIContentSuggestions = async () => {
    setAiGenerating(true);
    setImproveError('');
    const platformName = platforms[platform].name;
    const toneName = toneStyles[toneStyle].name;
    const wantsHashtags = ['twitter', 'instagram', 'linkedin'].includes(platform);

    const prompt = `Sen üst düzey bir Türkçe içerik editörü ve manşet yazarısın. Aşağıdaki metni oku, ANA MESAJINI/HABER DEĞERİNİ kavra ve "${platformName}" platformuna, "${toneName}" tonuna uygun öneriler üret.

KALİTE KURALLARI (ÇOK ÖNEMLİ):
- Başlıklar metnin İLK KELİMELERİNİ TEKRARLAMASIN. Metindeki asıl olayı/sonucu/haberi yakala.
- Her başlık FARKLI bir açıdan yazılsın: (1) haber değeri/olgu, (2) merak uyandıran, (3) fayda/çağrı odaklı.
- Metindeki somut detayları kullan (isim, tarih, yer, sayı, kurum) — genel/şablon ifadelerden kaçın.
- "Kapsamlı Analiz", "Ne Bilmeliyiz?", "Detaylı İnceleme" gibi içi boş kalıpları ASLA kullanma.
- Habercilik/gazete tonunda: abartısız, net, 5N1K'yı yansıtan manşetler yaz.
- Başlıklar kısa ve vurucu olsun (ideal 6-12 kelime).

İSTENEN:
- headlines: yukarıdaki kurallara uyan 3 özgün başlık
- metaDescription: metni özetleyen, 150 karakteri geçmeyen, SEO uyumlu açıklama
- hashtags: ${wantsHashtags ? 'metnin konusuyla ilgili 5 etkili hashtag (# ile)' : 'boş dizi []'}

SADECE geçerli JSON döndür, başka HİÇBİR şey yazma (markdown, açıklama, ön söz yok):
{"headlines": ["...", "...", "..."], "metaDescription": "...", "hashtags": []}

METİN:
"""
${text.slice(0, 2000)}
"""`;

    try {
      const response = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const rawText = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${rawText.slice(0, 100)}`);
      let data;
      try { data = JSON.parse(rawText); }
      catch (e) { throw new Error('API yanıtı JSON değil: ' + rawText.slice(0, 100)); }
      if (!Array.isArray(data.content)) throw new Error(data?.error?.message || 'Yanıtta içerik dizisi yok');
      let body = data.content.filter((i) => i.type === 'text').map((i) => i.text).join('').trim();
      body = body.replace(/```json|```/g, '').trim();
      const s = body.indexOf('{');
      const e = body.lastIndexOf('}');
      if (s !== -1 && e !== -1 && e > s) body = body.slice(s, e + 1);
      let parsed;
      try { parsed = JSON.parse(body); }
      catch (e) { throw new Error('Model geçerli JSON üretemedi: ' + body.slice(0, 100)); }
      const newHeadlines = Array.isArray(parsed.headlines) ? parsed.headlines.filter(Boolean) : [];
      if (newHeadlines.length === 0) throw new Error('Model boş başlık döndürdü');
      setAiSuggestions({
        headlines: newHeadlines,
        metaDescription: parsed.metaDescription || '',
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : []
      });
      setSuggestionsSource('ai');
    } catch (err) {
      console.error('AI öneri hatası:', err);
      setImproveError('AI önerileri üretilemedi → ' + (err.message || 'bilinmeyen hata'));
      setSuggestionsSource('template');
    } finally {
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    const id = 'montserrat-font-link';
    if (typeof document !== 'undefined' && !document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const fillerWords = ['şey', 'biraz', 'gibi', 'falan', 'filan', 'yani', 'aslında', 'açıkçası', 'gerçekten', 'oldukça', 'sanki', 'hani', 'işte', 'valla', 'ya'];

  const renderHighlighted = (inputText) => {
    const matches = segmentSentences(inputText);
    return matches.map((sentence, sIdx) => {
      const wc = sentence.trim().split(/\s+/).filter(Boolean).length;
      let bg = 'transparent';
      let title = '';
      if (wc > 30) { bg = '#FFCDD2'; title = `Çok uzun cümle (${wc} kelime)`; }
      else if (wc > 20) { bg = '#FFF9C4'; title = `Uzun cümle (${wc} kelime)`; }
      const tokens = sentence.split(/(\s+)/);
      const inner = tokens.map((tok, i) => {
        if (/^\s+$/.test(tok) || tok === '') return tok;
        const clean = tok.toLowerCase().replace(/[.,!?;:"'’()]/g, '');
        if (clean && isPassiveWord(clean)) {
          return <span key={i} style={{ borderBottom: '2px solid #1976D2', color: '#0D47A1' }} title="Pasif yapı">{tok}</span>;
        }
        if (fillerWords.includes(clean)) {
          return <span key={i} style={{ backgroundColor: '#E1BEE7', borderRadius: '3px' }} title="Dolgu/gereksiz kelime">{tok}</span>;
        }
        return tok;
      });
      return <span key={sIdx} style={{ backgroundColor: bg, borderRadius: '3px' }} title={title}>{inner}</span>;
    });
  };

  const countHighlightIssues = (inputText) => {
    if (!inputText.trim()) return { longSentences: 0, passive: 0, filler: 0, total: 0 };
    const matches = segmentSentences(inputText);
    let longSentences = 0, passive = 0, filler = 0;
    matches.forEach((sentence) => {
      const wc = sentence.trim().split(/\s+/).filter(Boolean).length;
      if (wc > 20) longSentences++;
      sentence.split(/\s+/).forEach((tok) => {
        const clean = tok.toLowerCase().replace(/[.,!?;:"'’()]/g, '');
        if (clean && isPassiveWord(clean)) passive++;
        if (fillerWords.includes(clean)) filler++;
      });
    });
    return { longSentences, passive, filler, total: longSentences + passive + filler };
  };

  const selStyle = { width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: 'white' };
  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' };

  useEffect(() => {
    setMetrics(analyzeText(text));
    if (text.trim()) {
      setAiSuggestions(generateTemplateSuggestions(text, platform));
      setSuggestionsSource('template');
    }
  }, [text, platform, audienceType, toneStyle, language]);

  const handleClear = () => {
    setText('');
    setImprovedText('');
    setShowComparison(false);
    setImprovedMetrics(null);
    setCompareMode(false);
    setImproveError('');
    setIsImproving(false);
    setSuggestionsSource('template');
  };

  const improveReadability = async () => {
    setIsImproving(true);
    setImproveError('');
    const platformName = platforms[platform].name;
    const audienceName = audienceTypes[audienceType].name;
    const toneName = toneStyles[toneStyle].name;
    const toneDesc = toneStyles[toneStyle].desc;

    const audienceInstruction = audienceType === 'spesifik'
      ? 'Hedef kitle spesifik/uzman bir gruptur; terminolojiyi koru ancak akışı netleştir.'
      : 'Hedef kitle geneldir; herkesin anlayabileceği sade bir dil kullan.';
    const toneInstruction = toneStyle === 'genel'
      ? 'Metnin mevcut tonunu koru, belirli bir tona zorlama.'
      : `Metni "${toneName}" tonuna uygun hale getir (${toneDesc}). Tonu kelime seçimi, cümle ritmi ve hitap tarzıyla yansıt.`;
    const platformInstruction = {
      twitter: 'Twitter/X için: kısa, vurucu, 280 karakter sınırını gözet.',
      instagram: 'Instagram için: akıcı, sıcak, görsel anlatıma uygun caption tarzı.',
      linkedin: 'LinkedIn için: profesyonel ama erişilebilir, sektörel güven veren bir dil.',
      facebook: 'Facebook için: konuşma dilinde, etkileşime açık, samimi.',
      gazete: 'Gazete için: 5N1K netliğinde, objektif, haber dili.',
      haber: 'Haber portalı için: hızlı okunan, net, dijital haber formatı.',
      blog: 'Blog/Dergi için: derinlikli, alt başlıklara uygun, akıcı.',
      genel: 'Genel kullanım için dengeli ve evrensel bir dil kullan.'
    }[platform] || 'Genel kullanım için dengeli bir dil kullan.';

    const prompt = `Sen uzman bir Türkçe editör ve metin iyileştirme uzmanısın. Aşağıdaki metni okunabilirliğini en üst düzeye çıkaracak şekilde profesyonelce yeniden yaz.

HEDEF BAĞLAM:
- Platform: ${platformName} → ${platformInstruction}
- Hedef Kitle: ${audienceName} → ${audienceInstruction}
- Ton: ${toneName}

UYGULANACAK İYİLEŞTİRMELER (HEPSİNİ UYGULA):
1. PASİF→AKTİF: Pasif yapıları aktif cümlelere çevir. Anlatımı dinamik ve canlı yap.
2. GEREKSİZ KELİMELER: Dolgu kelimelerini (şey, biraz, gibi, falan, yani, aslında) ve gereksiz tekrarları temizle.
3. BASİTLEŞTİRME: Gereksiz yere karmaşık/akademik kelimeleri anlaşılır Türkçe karşılıklarıyla değiştir.
4. CÜMLE YAPISI: Uzun cümleleri mantıklı şekilde böl. Özne-yüklem-nesne akışını düzelt. Çift olumsuzları sadeleştir.
5. GEÇİŞ İFADELERİ: Cümleler ve paragraflar arası mantıksal akışı sağlamak için uygun bağlaçlar ekle.
6. PARAGRAF YAPISI: Metni anlamlı paragraflara böl. Uzun paragrafları parçala.

TON TALİMATI: ${toneInstruction}

KESİN KURALLAR:
- Metnin orijinal anlamını, mesajını ve niyetini KORU.
- Yeni bilgi EKLEME, mevcut bilgiyi ÇIKARMA. Sadece dili ve yapıyı iyileştir.
- Türkçe dilbilgisi ve yazım kurallarına eksiksiz uy.
- SADECE iyileştirilmiş metni döndür. Açıklama, başlık, not, markdown veya ön söz EKLEME.

İYİLEŞTİRİLECEK METİN:
"""
${text}
"""`;

    try {
      const response = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 4000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await response.json();
      let result = data.content.filter((item) => item.type === "text").map((item) => item.text).join("\n").trim();
      result = result.replace(/^"""\s*|\s*"""$/g, '').replace(/^```[a-zçğıöşü]*\n?|\n?```$/gi, '').trim();
      if (!result) throw new Error('Boş yanıt alındı.');
      setImprovedText(result);
      setImprovedMetrics(analyzeText(result));
      setShowComparison(true);
    } catch (err) {
      console.error('İyileştirme hatası:', err);
      setImproveError('Metin iyileştirilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsImproving(false);
    }
  };

  const useImprovedText = () => {
    setText(improvedText);
    setShowComparison(false);
    setImprovedText('');
    setImprovedMetrics(null);
  };

  const revertToOriginal = () => {
    setShowComparison(false);
    setImprovedText('');
    setImprovedMetrics(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const getSuggestions = () => {
    const suggestions = [];
    if (parseFloat(metrics.avgSentenceLength) > 20) suggestions.push('Cümleleriniz çok uzun. Daha kısa cümleler kullanmayı deneyin.');
    if (metrics.readabilityScore < 50) suggestions.push('Okunabilirlik düşük (Ateşman). Kelime ve cümle uzunluğunu azaltarak metni sadeleştirin.');
    if (parseFloat(metrics.avgSyllables) > 3) suggestions.push('Çok heceli kelimeler ağırlıkta; daha kısa ve yalın kelimeler okunabilirliği artırır.');
    if (metrics.bezirciLevel && (metrics.bezirciLevel.includes('Akademik') || metrics.bezirciLevel.includes('Lisans'))) suggestions.push(`Metin ${metrics.bezirciLevel} düzeyinde. Geniş kitleye sesleniyorsanız sadeleştirin.`);
    if (metrics.toneAnalysis.passiveCount > 2) suggestions.push(`${metrics.toneAnalysis.passiveCount} pasif yapı tespit edildi; aktif çatıya çevirerek anlatımı güçlendirin.`);
    if (metrics.advancedAnalysis.repeatedWords.length > 0) suggestions.push(`"${metrics.advancedAnalysis.repeatedWords[0].word}" kelimesi ${metrics.advancedAnalysis.repeatedWords[0].count} kez geçiyor; eş anlamlılarla çeşitlendirin.`);
    if (parseFloat(metrics.advancedAnalysis.sentenceVariety) < 4) suggestions.push('Cümle uzunlukları birbirine yakın; uzunluk çeşitliliği metni canlandırır.');
    if (metrics.advancedAnalysis.intensifierTotal >= 3) suggestions.push(`${metrics.advancedAnalysis.intensifierTotal} pekiştireç/zayıf zarf var (örn. "${metrics.advancedAnalysis.intensifiers[0].word}"); daha güçlü kelimelerle değiştirin.`);
    if (metrics.advancedAnalysis.repeatedOpeners && metrics.advancedAnalysis.repeatedOpeners.length > 0) suggestions.push(`${metrics.advancedAnalysis.repeatedOpeners[0].count} cümle "${metrics.advancedAnalysis.repeatedOpeners[0].phrase}…" ile başlıyor; açılışı çeşitlendirin.`);
    if (metrics.toneAnalysis.activePassiveRatio < 60) suggestions.push('Aktif cümle kullanımını artırarak yazınızı daha dinamik hale getirebilirsiniz.');
    if (metrics.advancedAnalysis.transitionWords < 2) suggestions.push('Geçiş ifadeleri ekleyerek cümleler arası akışı iyileştirebilirsiniz.');
    if (platform === 'twitter' && metrics.characters > 280) suggestions.push('Twitter için metin çok uzun. 280 karakteri geçmeyin.');
    if (platform === 'instagram' && metrics.words > 150) suggestions.push('Instagram için daha kısa ve öz bir metin tercih edin.');
    if (platform === 'linkedin' && metrics.toneAnalysis.formalityScore < 50) suggestions.push('LinkedIn için daha profesyonel bir ton kullanın.');
    if (suggestions.length === 0) suggestions.push('Metin dengeli görünüyor. Belirgin bir okunabilirlik sorunu tespit edilmedi.');
    return suggestions.slice(0, 6);
  };

  const renderComparePlatforms = () => (
    <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: '20px' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>Platform Karşılaştırması</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
        {comparePlatforms.map((plt) => {
          const pltMetrics = analyzeText(text);
          const pltScore = calculatePlatformScore(plt, {
            characters: pltMetrics.characters, wordCount: pltMetrics.words, sentenceCount: pltMetrics.sentences,
            readabilityScore: pltMetrics.readabilityScore, formalityScore: pltMetrics.toneAnalysis.formalityScore
          });
          return (
            <div key={plt} style={{ backgroundColor: '#F5F5F5', padding: '20px', borderRadius: '8px', border: `2px solid ${platforms[plt].color}` }}>
              <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '10px' }}>{platforms[plt].icon}</div>
              <h3 style={{ textAlign: 'center', color: platforms[plt].color, marginBottom: '15px' }}>{platforms[plt].name}</h3>
              <div style={{ backgroundColor: getScoreColor(pltScore), color: '#1A1A1A', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{pltScore}</div>
                <div style={{ fontSize: '14px' }}>Uygunluk Skoru</div>
              </div>
              <div style={{ marginTop: '15px', fontSize: '13px', color: '#666' }}>
                <div style={{ marginBottom: '8px' }}><strong>Karakter:</strong> {pltMetrics.characters}{plt === 'twitter' && pltMetrics.characters > 280 && ' ⚠️'}</div>
                <div style={{ marginBottom: '8px' }}><strong>Kelime:</strong> {pltMetrics.words}</div>
                <div><strong>Okunabilirlik:</strong> {pltMetrics.readabilityScore}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="yaz-analiz" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`
        .yaz-analiz, .yaz-analiz * { font-family: 'Montserrat', sans-serif; }
        .yaz-analiz button:focus-visible, .yaz-analiz select:focus-visible, .yaz-analiz textarea:focus-visible {
          outline: 3px solid #1565C0; outline-offset: 2px;
        }
        @media (max-width: 768px) {
          .yaz-analiz .ya-grid-collapse { grid-template-columns: 1fr !important; }
          .yaz-analiz .ya-dashboard { position: static !important; }
        }
      `}</style>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>Gelişmiş Yazı Analiz Aracı</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px', backgroundColor: '#F5F5F5', padding: '20px', borderRadius: '8px' }}>
        <div>
          <label style={labelStyle}>📱 Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={selStyle}>
            {Object.entries(platforms).map(([key, val]) => (<option key={key} value={key}>{val.icon} {val.name}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>👥 Hedef Kitle</label>
          <select value={audienceType} onChange={(e) => setAudienceType(e.target.value)} style={selStyle}>
            {Object.entries(audienceTypes).map(([key, val]) => (<option key={key} value={key}>{val.icon} {val.name}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>🎭 Ton</label>
          <select value={toneStyle} onChange={(e) => setToneStyle(e.target.value)} style={selStyle}>
            {Object.entries(toneStyles).map(([key, val]) => (<option key={key} value={key}>{val.icon} {val.name}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>🌐 Dil</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selStyle}>
            <option value="tr">🇹🇷 Türkçe (Ateşman + Bezirci-Yılmaz)</option>
            <option value="en">🇬🇧 İngilizce (Flesch-Kincaid)</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Analiz etmek istediğiniz yazıyı buraya yapıştırın..."
          style={{ width: '100%', minHeight: '200px', padding: '15px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#F5F5F5', resize: 'vertical', boxSizing: 'border-box' }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleClear} style={{ padding: '12px 30px', fontSize: '16px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Temizle</button>
        {text.trim() && !showComparison && (
          <>
            <button onClick={improveReadability} disabled={isImproving} style={{ padding: '12px 30px', fontSize: '16px', backgroundColor: isImproving ? '#A5D6A7' : '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: isImproving ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {isImproving ? '✨ İyileştiriliyor...' : '✨ Okunabilirliği Artır (AI)'}
            </button>
            <button onClick={() => setCompareMode(!compareMode)} style={{ padding: '12px 30px', fontSize: '16px', backgroundColor: compareMode ? '#9E9E9E' : '#2196F3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {compareMode ? 'Karşılaştırmayı Kapat' : 'Platform Karşılaştır'}
            </button>
          </>
        )}
      </div>

      {improveError && (
        <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px solid #EF9A9A' }}>⚠️ {improveError}</div>
      )}

      {compareMode && text.trim() && renderComparePlatforms()}

      {text.trim() && !showComparison && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <button onClick={() => setShowHighlight(!showHighlight)} style={{ padding: '10px 24px', fontSize: '14px', backgroundColor: showHighlight ? '#9E9E9E' : '#7E57C2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {showHighlight ? '🖍️ Vurgulamayı Kapat' : '🖍️ Satır İçi Vurgula'}
            </button>
          </div>
          {showHighlight && (
            <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {countHighlightIssues(text).total === 0 && (
                <div style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '14px 18px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px', border: '1px solid #A5D6A7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>✅</span>
                  <span>Vurgulanacak bir sorun bulunamadı: cümleler makul uzunlukta, belirgin pasif yapı veya dolgu kelimesi yok. Metin bu yönlerden temiz.</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '18px', fontSize: '13px', color: '#555' }}>
                <span style={{ backgroundColor: '#FFF9C4', padding: '2px 8px', borderRadius: '3px' }}>Uzun cümle (20+)</span>
                <span style={{ backgroundColor: '#FFCDD2', padding: '2px 8px', borderRadius: '3px' }}>Çok uzun (30+)</span>
                <span style={{ borderBottom: '2px solid #1976D2', color: '#0D47A1', padding: '0 2px' }}>Pasif yapı</span>
                <span style={{ backgroundColor: '#E1BEE7', padding: '2px 8px', borderRadius: '3px' }}>Dolgu kelimesi</span>
              </div>
              <div style={{ fontSize: '16px', lineHeight: '2', whiteSpace: 'pre-wrap', color: '#333' }}>
                {renderHighlighted(text)}
              </div>
            </div>
          )}
        </div>
      )}

      {text.trim() && !showComparison && (
        <div className="ya-grid-collapse" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>{platforms[platform].icon} {platforms[platform].name} - Analiz Sonuçları</h2>

            {language === 'tr' ? (
              <div style={{ marginBottom: '25px' }}>
                <div style={{ backgroundColor: getScoreColor(metrics.readabilityScore), color: '#1A1A1A', padding: '25px', borderRadius: '8px 8px 0 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '5px' }}>{metrics.readabilityScore}<span style={{ fontSize: '20px', opacity: 0.85 }}> / 100</span></div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.readabilityLevel}</div>
                  <div style={{ fontSize: '13px', marginTop: '10px', opacity: 0.9 }}>Ateşman Okunabilirlik Skoru</div>
                </div>
                <div style={{ backgroundColor: '#37474F', color: 'white', padding: '18px 25px', borderRadius: '0 0 8px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>Bezirci-Yılmaz (Yeni Okunabilirlik Değeri)</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{metrics.bezirciLevel}</div>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{metrics.bezirciScore}</div>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '25px' }}>
                <div style={{ backgroundColor: getScoreColor(Math.max(0, Math.min(100, metrics.fleschEase))), color: '#1A1A1A', padding: '25px', borderRadius: '8px 8px 0 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '5px' }}>{metrics.fleschEase}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Flesch Reading Ease</div>
                  <div style={{ fontSize: '13px', marginTop: '6px', opacity: 0.9 }}>0–100 (yüksek = kolay)</div>
                </div>
                <div style={{ backgroundColor: '#37474F', color: 'white', padding: '18px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '15px' }}>Flesch-Kincaid Sınıf Düzeyi</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{metrics.fleschGrade}</div>
                </div>
                <div style={{ backgroundColor: '#FFF8E1', color: '#8D6E00', padding: '10px 25px', borderRadius: '0 0 8px 8px', fontSize: '12px', textAlign: 'center', border: '1px solid #FFE082' }}>
                  ⚠️ Flesch-Kincaid yalnızca İngilizce metinler için geçerlidir; Türkçe metinlerde sapmalı sonuç verir.
                </div>
              </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px' }}>
              <thead>
                <tr style={{ backgroundColor: '#E0E0E0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Metrik</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>Değer</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '12px', border: '1px solid #ddd' }}>Karakter Sayısı</td><td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>{metrics.characters}{platform === 'twitter' && metrics.characters > 280 && <span style={{ color: '#F44336' }}> ⚠️</span>}</td></tr>
                <tr style={{ backgroundColor: '#fafafa' }}><td style={{ padding: '12px', border: '1px solid #ddd' }}>Kelime Sayısı</td><td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>{metrics.words}</td></tr>
                <tr><td style={{ padding: '12px', border: '1px solid #ddd' }}>Cümle Sayısı</td><td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>{metrics.sentences}</td></tr>
                <tr style={{ backgroundColor: '#fafafa' }}><td style={{ padding: '12px', border: '1px solid #ddd' }}>Ortalama Hece / Kelime</td><td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>{metrics.avgSyllables}</td></tr>
                <tr><td style={{ padding: '12px', border: '1px solid #ddd' }}>Ortalama Kelime Uzunluğu</td><td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>{metrics.avgWordLength} harf</td></tr>
                <tr style={{ backgroundColor: '#fafafa' }}><td style={{ padding: '12px', border: '1px solid #ddd' }}>Ortalama Cümle Uzunluğu</td><td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>{metrics.avgSentenceLength} kelime</td></tr>
              </tbody>
            </table>

            <div style={{ backgroundColor: '#E3F2FD', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ color: '#1976D2', marginTop: 0, marginBottom: '15px' }}>🎭 Ton ve Üslup Analizi</h3>
              <div className="ya-grid-collapse" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Formalite:</strong>
                  <div style={{ backgroundColor: getScoreColor(metrics.toneAnalysis.formalityScore), color: '#1A1A1A', padding: '8px', borderRadius: '4px', marginTop: '5px', textAlign: 'center' }}>{metrics.toneAnalysis.formalityScore >= 60 ? 'Formal' : metrics.toneAnalysis.formalityScore < 40 ? 'İnformal' : 'Nötr'} ({metrics.toneAnalysis.formalityScore}%)</div>
                </div>
                <div>
                  <strong>Aktif Cümle Oranı:</strong>
                  <div style={{ backgroundColor: getScoreColor(metrics.toneAnalysis.activePassiveRatio), color: '#1A1A1A', padding: '8px', borderRadius: '4px', marginTop: '5px', textAlign: 'center' }}>%{metrics.toneAnalysis.activePassiveRatio} <span style={{ fontSize: '11px', opacity: 0.85 }}>({metrics.toneAnalysis.passiveCount} pasif)</span></div>
                </div>
                <div>
                  <strong>Duygusal Ton:</strong>
                  <div style={{ backgroundColor: metrics.toneAnalysis.emotionalTone === 'pozitif' ? '#4CAF50' : metrics.toneAnalysis.emotionalTone === 'negatif' ? '#F44336' : '#9E9E9E', color: 'white', padding: '8px', borderRadius: '4px', marginTop: '5px', textAlign: 'center', textTransform: 'capitalize' }}>{metrics.toneAnalysis.emotionalTone}</div>
                </div>
                <div>
                  <strong>Hitap Şekli:</strong>
                  <div style={{ backgroundColor: '#607D8B', color: 'white', padding: '8px', borderRadius: '4px', marginTop: '5px', textAlign: 'center' }}>{metrics.toneAnalysis.addressStyle}</div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#F3E5F5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ color: '#7B1FA2', marginTop: 0, marginBottom: '15px' }}>🔍 Gelişmiş Dil Analizi</h3>
              <div style={{ marginBottom: '10px' }}><strong>Cümle Çeşitliliği:</strong> {metrics.advancedAnalysis.sentenceVariety}/10</div>
              <div style={{ marginBottom: '10px' }}><strong>Geçiş İfadeleri:</strong> {metrics.advancedAnalysis.transitionWords} adet</div>
              <div style={{ marginBottom: '10px' }}><strong>Bağlaç Çeşitliliği:</strong> {metrics.advancedAnalysis.conjunctionDiversity}/10</div>
              {metrics.advancedAnalysis.repeatedWords.length > 0 && (
                <div>
                  <strong>Çok Tekrar Eden Kelimeler:</strong>
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    {metrics.advancedAnalysis.repeatedWords.map((item, idx) => (
                      <span key={idx} style={{ display: 'inline-block', backgroundColor: '#CE93D8', color: 'white', padding: '4px 8px', borderRadius: '4px', marginRight: '8px', marginBottom: '8px' }}>{item.word} ({item.count}x)</span>
                    ))}
                  </div>
                </div>
              )}

              {metrics.advancedAnalysis.lengthDistribution && metrics.advancedAnalysis.lengthDistribution.some((b) => b.count > 0) && (
                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #E1BEE7' }}>
                  <strong>Cümle Uzunluğu Dağılımı (ritim):</strong>
                  <div style={{ marginTop: '10px' }}>
                    {(() => {
                      const dist = metrics.advancedAnalysis.lengthDistribution;
                      const max = Math.max(...dist.map((b) => b.count), 1);
                      return dist.map((b, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
                          <span style={{ width: '70px', color: '#666', flexShrink: 0 }}>{b.label} kelime</span>
                          <div style={{ flex: 1, backgroundColor: '#F3E5F5', borderRadius: '4px', height: '20px', position: 'relative' }}>
                            <div style={{ width: `${(b.count / max) * 100}%`, backgroundColor: b.label === '30+' && b.count > 0 ? '#E57373' : '#BA68C8', height: '100%', borderRadius: '4px', minWidth: b.count > 0 ? '3px' : '0', transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ width: '28px', textAlign: 'right', color: '#555', flexShrink: 0 }}>{b.count}</span>
                        </div>
                      ));
                    })()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#616161', marginTop: '6px', fontStyle: 'italic' }}>
                    Tek kovada yığılma monotonluk, dağılım ritim demektir. Kırmızı (30+) cümleler bölünmeye adaydır.
                  </div>
                </div>
              )}

              <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #E1BEE7' }}>
                <strong>Pekiştireç / Zayıf Zarf:</strong>{' '}
                {metrics.advancedAnalysis.intensifierTotal > 0 ? (
                  <>
                    <span style={{ color: metrics.advancedAnalysis.intensifierTotal >= 4 ? '#E65100' : '#666' }}>{metrics.advancedAnalysis.intensifierTotal} adet</span>
                    <div style={{ marginTop: '8px', fontSize: '14px' }}>
                      {metrics.advancedAnalysis.intensifiers.map((item, idx) => (
                        <span key={idx} style={{ display: 'inline-block', backgroundColor: '#FFE0B2', color: '#E65100', padding: '4px 8px', borderRadius: '4px', marginRight: '8px', marginBottom: '8px' }}>{item.word} ({item.count}x)</span>
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', color: '#616161', marginTop: '2px', fontStyle: 'italic' }}>Güçlü fiil/isim, zayıf sıfat+zarftan iyidir. Her şey "çok"sa hiçbir şey vurgulu değildir.</div>
                  </>
                ) : (
                  <span style={{ color: '#2E7D32' }}>temiz ✅</span>
                )}
              </div>

              {metrics.advancedAnalysis.repeatedOpeners && metrics.advancedAnalysis.repeatedOpeners.length > 0 && (
                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #E1BEE7' }}>
                  <strong>Tekrar Eden Cümle Başları:</strong>
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    {metrics.advancedAnalysis.repeatedOpeners.map((item, idx) => (
                      <div key={idx} style={{ marginBottom: '4px', color: '#555' }}>
                        <span style={{ color: '#7B1FA2', fontWeight: 'bold' }}>{item.count} cümle</span> "{item.phrase}…" ile başlıyor
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#616161', marginTop: '6px', fontStyle: 'italic' }}>Aynı açılış metni durağanlaştırır; özneyi/açılışı çeşitlendirin.</div>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#FFF3E0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                <h3 style={{ color: '#F57C00', margin: 0 }}>
                  📝 İçerik Önerileri
                  <span style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '8px', backgroundColor: suggestionsSource === 'ai' ? '#4CAF50' : '#9E9E9E', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>
                    {suggestionsSource === 'ai' ? 'AI üretimi' : 'şablon'}
                  </span>
                </h3>
                <button onClick={generateAIContentSuggestions} disabled={aiGenerating} style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: aiGenerating ? '#A5D6A7' : '#F57C00', color: 'white', border: 'none', borderRadius: '6px', cursor: aiGenerating ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  {aiGenerating ? 'Üretiliyor...' : '✨ AI ile Üret'}
                </button>
              </div>
              {aiSuggestions.headlines.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <strong>Başlık Önerileri:</strong>
                  {aiSuggestions.headlines.map((headline, idx) => (
                    <div key={idx} style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px', marginTop: '8px', border: '1px solid #FFB74D' }}>{headline}</div>
                  ))}
                </div>
              )}
              {aiSuggestions.metaDescription && (
                <div style={{ marginBottom: '15px' }}>
                  <strong>Meta Açıklama:</strong>
                  <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px', marginTop: '8px', border: '1px solid #FFB74D' }}>{aiSuggestions.metaDescription}</div>
                </div>
              )}
              {aiSuggestions.hashtags.length > 0 && (
                <div>
                  <strong>Hashtag Önerileri:</strong>
                  <div style={{ marginTop: '8px' }}>
                    {aiSuggestions.hashtags.map((tag, idx) => (
                      <span key={idx} style={{ display: 'inline-block', backgroundColor: platforms[platform].color, color: 'white', padding: '6px 12px', borderRadius: '20px', marginRight: '8px', marginBottom: '8px', fontSize: '14px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {getSuggestions().length > 0 && (
              <div style={{ backgroundColor: '#E8F5E9', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #4CAF50' }}>
                <h3 style={{ color: '#2E7D32', marginTop: 0, marginBottom: '10px' }}>💡 Öneriler</h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {getSuggestions().map((suggestion, index) => (<li key={index} style={{ marginBottom: '8px', color: '#555' }}>{suggestion}</li>))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <div className="ya-dashboard" style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: '20px' }}>
              <h3 style={{ color: '#333', marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>📊 Performans Dashboard</h3>
              {[
                { label: 'SEO Skoru', val: metrics.seoScore, estimated: false },
                { label: 'Platform Uygunluğu', val: metrics.platformScore, estimated: true },
                { label: 'Engagement Potansiyeli', val: metrics.engagementScore, estimated: true },
                { label: 'Güvenilirlik Skoru', val: metrics.trustScore, estimated: true }
              ].map((m, i) => (
                <div key={i} style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <span>{m.label}</span>
                    {m.estimated && (
                      <span style={{ fontSize: '10px', color: '#616161', backgroundColor: '#F0F0F0', padding: '1px 7px', borderRadius: '8px', fontStyle: 'italic', flexShrink: 0 }}>tahmini</span>
                    )}
                  </div>
                  <div style={{ backgroundColor: getScoreColor(m.val), color: '#1A1A1A', padding: m.estimated ? '12px' : '15px', borderRadius: '8px', textAlign: 'center', opacity: m.estimated ? 0.55 : 1 }}>
                    <div style={{ fontSize: m.estimated ? '30px' : '36px', fontWeight: 'bold' }}>{m.val}</div>
                    <div style={{ fontSize: '12px' }}>/ 100</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '15px', fontSize: '11px', color: '#616161', textAlign: 'center', fontStyle: 'italic' }}>
                "Tahmini" etiketli skorlar (platform, engagement, güven) sezgisel kestirimlerdir; ampirik veriyle kalibre edilmemiştir. SEO skoru kural tabanlıdır.
              </div>
            </div>
          </div>
        </div>
      )}

      {showComparison && improvedMetrics && (
        <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Önce/Sonra Karşılaştırması</h2>
          <div className="ya-grid-collapse" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ color: '#666', marginBottom: '15px', fontSize: '18px' }}>Orijinal Metin</h3>
              <div style={{ backgroundColor: '#FFF3E0', padding: '15px', borderRadius: '8px', minHeight: '200px', maxHeight: '400px', overflowY: 'auto', fontSize: '14px', lineHeight: '1.6', border: '2px solid #FFB74D', whiteSpace: 'pre-wrap' }}>{text}</div>
              <div style={{ backgroundColor: getScoreColor(metrics.readabilityScore), color: '#1A1A1A', padding: '15px', borderRadius: '8px', textAlign: 'center', marginTop: '15px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{metrics.readabilityScore}</div>
                <div style={{ fontSize: '16px' }}>{metrics.readabilityLevel}</div>
              </div>
            </div>
            <div>
              <h3 style={{ color: '#666', marginBottom: '15px', fontSize: '18px' }}>Geliştirilmiş Metin</h3>
              <div style={{ backgroundColor: '#E8F5E9', padding: '15px', borderRadius: '8px', minHeight: '200px', maxHeight: '400px', overflowY: 'auto', fontSize: '14px', lineHeight: '1.6', border: '2px solid #66BB6A', whiteSpace: 'pre-wrap' }}>{improvedText}</div>
              <div style={{ backgroundColor: getScoreColor(improvedMetrics.readabilityScore), color: '#1A1A1A', padding: '15px', borderRadius: '8px', textAlign: 'center', marginTop: '15px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{improvedMetrics.readabilityScore}</div>
                <div style={{ fontSize: '16px' }}>{improvedMetrics.readabilityLevel}</div>
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>{(improvedMetrics.readabilityScore - metrics.readabilityScore > 0 ? '+' : '')}{improvedMetrics.readabilityScore - metrics.readabilityScore} puan</div>
              </div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#E0E0E0' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Metrik</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Orijinal</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Geliştirilmiş</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Değişim</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: '12px', border: '1px solid #ddd' }}>Okunabilirlik (Ateşman)</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{metrics.readabilityScore}</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{improvedMetrics.readabilityScore}</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', color: improvedMetrics.readabilityScore > metrics.readabilityScore ? '#4CAF50' : '#666' }}>{improvedMetrics.readabilityScore > metrics.readabilityScore ? '+' : ''}{improvedMetrics.readabilityScore - metrics.readabilityScore}</td></tr>
              <tr style={{ backgroundColor: '#fafafa' }}><td style={{ padding: '12px', border: '1px solid #ddd' }}>Bezirci-Yılmaz (YOD)</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{metrics.bezirciScore}</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{improvedMetrics.bezirciScore}</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', color: '#666' }}>{(parseFloat(improvedMetrics.bezirciScore) - parseFloat(metrics.bezirciScore)).toFixed(1)}</td></tr>
              <tr><td style={{ padding: '12px', border: '1px solid #ddd' }}>Cümle Sayısı</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{metrics.sentences}</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{improvedMetrics.sentences}</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', color: '#666' }}>{improvedMetrics.sentences > metrics.sentences ? '+' : ''}{improvedMetrics.sentences - metrics.sentences}</td></tr>
              <tr style={{ backgroundColor: '#fafafa' }}><td style={{ padding: '12px', border: '1px solid #ddd' }}>Ortalama Cümle Uzunluğu</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{metrics.avgSentenceLength}</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{improvedMetrics.avgSentenceLength}</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', color: parseFloat(improvedMetrics.avgSentenceLength) < parseFloat(metrics.avgSentenceLength) ? '#4CAF50' : '#666' }}>{(parseFloat(improvedMetrics.avgSentenceLength) - parseFloat(metrics.avgSentenceLength)).toFixed(1)}</td></tr>
              <tr><td style={{ padding: '12px', border: '1px solid #ddd' }}>Pasif Yapı Sayısı</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{metrics.toneAnalysis.passiveCount}</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{improvedMetrics.toneAnalysis.passiveCount}</td><td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', color: improvedMetrics.toneAnalysis.passiveCount < metrics.toneAnalysis.passiveCount ? '#4CAF50' : '#666' }}>{improvedMetrics.toneAnalysis.passiveCount - metrics.toneAnalysis.passiveCount}</td></tr>
            </tbody>
          </table>
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <button onClick={useImprovedText} style={{ padding: '12px 30px', fontSize: '16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>Düzenlenen Metni Kullan</button>
            <button onClick={revertToOriginal} style={{ padding: '12px 30px', fontSize: '16px', backgroundColor: '#9E9E9E', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Orijinale Geri Dön</button>
          </div>
        </div>
      )}
    </div>
  );
}
