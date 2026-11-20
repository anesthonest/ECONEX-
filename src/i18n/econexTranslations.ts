/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.9 - Complete Multilingual i18n Framework & Reviewer Sign-Off Registry
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

export type EconexLanguageCode = 'en' | 'lg' | 'sw' | 'nyn' | 'ach' | 'teo' | 'xog';

export interface LanguageMetadata {
  code: string;
  name: string;
  nativeName: string;
  regionFocus: string;
  dir: 'ltr' | 'rtl';
  reviewStatus: 'VERIFIED_COMPLETE' | 'PARTIAL_COMMUNITY_REVIEW';
  reviewedLegalFinancial: boolean;
  locale: string;
  reviewerName?: string;
  reviewedAt?: string;
}

export const SUPPORTED_LANGUAGES: LanguageMetadata[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    regionFocus: 'Uganda & International',
    dir: 'ltr',
    reviewStatus: 'VERIFIED_COMPLETE',
    reviewedLegalFinancial: true,
    locale: 'en-UG',
    reviewerName: 'ECONEX Base Release',
  },
  {
    code: 'lg',
    name: 'Luganda',
    nativeName: 'Oluganda',
    regionFocus: 'Central Uganda',
    dir: 'ltr',
    reviewStatus: 'PARTIAL_COMMUNITY_REVIEW',
    reviewedLegalFinancial: false,
    locale: 'lg-UG',
  },
  {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    regionFocus: 'East African Community',
    dir: 'ltr',
    reviewStatus: 'PARTIAL_COMMUNITY_REVIEW',
    reviewedLegalFinancial: false,
    locale: 'sw-UG',
  },
  {
    code: 'nyn',
    name: 'Runyankole',
    nativeName: 'Runyankore-Rukiga',
    regionFocus: 'Western Uganda',
    dir: 'ltr',
    reviewStatus: 'PARTIAL_COMMUNITY_REVIEW',
    reviewedLegalFinancial: false,
    locale: 'nyn-UG',
  },
  {
    code: 'ach',
    name: 'Acholi',
    nativeName: 'Lwo (Acholi)',
    regionFocus: 'Northern Uganda',
    dir: 'ltr',
    reviewStatus: 'PARTIAL_COMMUNITY_REVIEW',
    reviewedLegalFinancial: false,
    locale: 'ach-UG',
  },
  {
    code: 'teo',
    name: 'Ateso',
    nativeName: 'Ateso',
    regionFocus: 'Eastern Uganda (Teso)',
    dir: 'ltr',
    reviewStatus: 'PARTIAL_COMMUNITY_REVIEW',
    reviewedLegalFinancial: false,
    locale: 'teo-UG',
  },
  {
    code: 'xog',
    name: 'Lusoga',
    nativeName: 'Olusoga',
    regionFocus: 'Busoga Sub-region',
    dir: 'ltr',
    reviewStatus: 'PARTIAL_COMMUNITY_REVIEW',
    reviewedLegalFinancial: false,
    locale: 'xog-UG',
  },
];

// Sensitive legal/financial/contract confirmation keys always stay in verified English unless reviewer-approved
export const SENSITIVE_TRANSLATION_KEYS = new Set<string>([
  'confirm_payment_notice',
  'legal_terms_summary',
  'settlement_verification_note',
  'contract_binding_notice',
]);

const BASE_EN = {
  // Greetings & Navigation
  welcome_greeting: 'Welcome',
  what_to_do_today: 'What would you like to do today?',
  nav_home: 'Home',
  nav_explore: 'Explore',
  nav_activity: 'My Activity',
  nav_messages: 'Messages',
  nav_account: 'Account',
  nav_help: 'Help',
  // Primary Home Actions
  action_buy: 'Buy',
  action_buy_desc: 'Find products and services',
  action_sell: 'Sell',
  action_sell_desc: 'Offer products and services',
  action_work: 'Find Work',
  action_work_desc: 'Discover available opportunities',
  action_buyers: 'Find Buyers',
  action_buyers_desc: 'Connect with potential customers',
  action_business: 'My Business',
  action_business_desc: 'Manage business activity',
  action_transactions: 'My Transactions',
  action_transactions_desc: 'View payments and orders',
  recent_activity: 'Recent activity',
  my_orders: 'My orders',
  new_opportunities: 'New opportunities',
  notifications: 'Important notices',
  get_help: 'Help & Support',
  // Onboarding & Selling Steps
  onboarding_title: 'Set up your ECONEX account',
  onboarding_step_language: 'Choose your language',
  onboarding_step_role: 'How will you use ECONEX?',
  onboarding_step_details: 'Your name and district',
  listing_step_product: 'What are you selling?',
  listing_step_price: 'Set quantity and fair price',
  listing_step_publish: 'Put your product on sale now',
  // Order & Marketplace Labels
  order_status_submitted: 'Waiting for seller confirmation',
  order_status_accepted: 'Accepted by seller',
  order_status_in_transit: 'On the way to delivery point',
  order_status_delivered: 'Delivered — confirm receipt',
  order_status_completed: 'Completed',
  // Voice & Offline
  voice_prompt_hint: 'Speak or tap a command',
  voice_read_aloud: 'Read aloud',
  offline_online: 'Online',
  offline_offline: 'Offline',
  offline_syncing: 'Synchronizing',
  offline_saved_local: 'Saved on this device',
  offline_waiting_sync: 'Waiting to synchronize',
  offline_sync_failed: 'Synchronization failed',
  // Support & Account
  support_open_case: 'Send a Support Request',
  support_case_saved: 'Support request saved with a case number',
  account_experience_mode: 'Choose your workspace level',
  error_try_again: 'Try Again',
  status_checking_account: 'We are checking your account',
  status_pay_order: 'Pay for your order',
  status_put_for_sale: 'Put your product up for sale',
  status_check_payment: 'Check whether your payment was received',
  status_request_goods: 'Request products or services',
  // Legal & Payment Safeties (protected until reviewer-approved)
  confirm_payment_notice: 'Please review the exact amount, recipient, and provider before confirming this payment.',
  legal_terms_summary: 'Orders and agreements are recorded with your consent under standard trade rules.',
  settlement_verification_note: 'A payment is marked received only after confirmed proof from your payment provider.',
  contract_binding_notice: 'Only confirm once you have reviewed quantities, prices, and delivery terms.',
};

export type EconexTranslationKey = keyof typeof BASE_EN;

const LOCAL_TRANSLATIONS: Record<string, Partial<Record<EconexTranslationKey, string>>> = {
  lg: {
    welcome_greeting: 'Tukusanyukidde',
    what_to_do_today: 'Oyagala kukola ki leero?',
    nav_home: 'Awaka',
    nav_explore: 'Noonya',
    nav_activity: 'Emirimu Gyange',
    nav_messages: 'Obubaka',
    nav_account: 'Akawunti',
    nav_help: 'Obuyambi',
    action_buy: 'Gula',
    action_buy_desc: 'Funa ebintu n’obuweereza',
    action_sell: 'Tunda',
    action_sell_desc: 'Teekayo ebintu byo ogulwe',
    action_work: 'Funa Omulimu',
    action_work_desc: 'Zuula emikisa egy’emirimu',
    action_buyers: 'Funa Abaguzi',
    action_buyers_desc: 'Yunga n’abaguzi abaliwo',
    action_business: 'Bizinensi Yange',
    action_business_desc: 'Ddukanya bizinensi yo',
    action_transactions: 'Ensasula Zange',
    action_transactions_desc: 'Laba ensimbi ne biragiro',
    recent_activity: 'Ebikoleddwa Gye Buvuddeko',
    my_orders: 'Ebiragiro Byange',
    new_opportunities: 'Emikisa Emipya',
    notifications: 'Obubaka Obukulu',
    get_help: 'Obuyambi n’Okudduukirira',
    onboarding_title: 'Tegeka akawunti yo eya ECONEX',
    onboarding_step_language: 'Londa olulimi lwo',
    onboarding_step_role: 'Onookozesa otya ECONEX?',
    onboarding_step_details: 'Erinnya lyo ne disitulikiti',
    listing_step_product: 'Otunda ki?',
    listing_step_price: 'Teeka obungi n’omuwendo omutuufu',
    listing_step_publish: 'Teeka ekintu kyo ku katale kati',
    order_status_submitted: 'Kirindiridde omutunzi okukikkiriza',
    order_status_accepted: 'Omutunzi akikkirizza',
    order_status_in_transit: 'Kiri mu kkubo okutuuka gy’oli',
    order_status_delivered: 'Kituuse — kakasa okufuna',
    order_status_completed: 'Kiwedde bulungi',
    voice_prompt_hint: 'Yogera oba nyiga ekiragiro',
    voice_read_aloud: 'Soma mu ddoboozi',
    offline_online: 'Ku Mutimbagano',
    offline_offline: 'Tewali Mutimbagano',
    offline_syncing: 'Kitereezebwa ku mutimbagano',
    offline_saved_local: 'Kiterekeddwa ku ssimu yo',
    offline_waiting_sync: 'Kirindiridde okuyungibwa',
    offline_sync_failed: 'Okuyunga kulemye',
    support_open_case: 'Wereza Okusaba Obuyambi',
    support_case_saved: 'Okusaba kwo kuterekeddwa ne namba',
    account_experience_mode: 'Londa eddaala ly’okukoleramu',
    error_try_again: 'Gezaako Nate',
    status_checking_account: 'Tukebera akawunti yo',
    status_pay_order: 'Sasula ekiragiro kyo',
    status_put_for_sale: 'Teeka ekintu kyo ku katale',
    status_check_payment: 'Kebera oba ensimbi zituuse',
    status_request_goods: 'Saba ebintu oba obuweereza',
    confirm_payment_notice: 'Bambi weekenneenye omuwendo omutuufu, afuna ensimbi, n’omuweereza nga tonnakakasa kusasula kuno.',
    legal_terms_summary: 'Ebiragiro n’endagaano biwandiikibwa olw’okukkiriza kwo wansi w’amateeka g’obusuubuzi amatuufu.',
    settlement_verification_note: 'Okusasula kukakasibwa nga kufuniddwa oluvannyuma lw’obujulizi obuvudde ku muweereza w’ensimbi wo.',
    contract_binding_notice: 'Kakasa oluvannyuma lw’okwekebejja obungi, ebbeeyi, n’enteekateeka y’okutuusa ebintu.',
  },
  sw: {
    welcome_greeting: 'Karibu',
    what_to_do_today: 'Ungependa kufanya nini leo?',
    nav_home: 'Nyumbani',
    nav_explore: 'Tafuta',
    nav_activity: 'Shughuli Zangu',
    nav_messages: 'Ujumbe',
    nav_account: 'Akaunti',
    nav_help: 'Msaada',
    action_buy: 'Nunua',
    action_buy_desc: 'Tafuta bidhaa na huduma',
    action_sell: 'Uza',
    action_sell_desc: 'Weka bidhaa zako sokoni',
    action_work: 'Tafuta Kazi',
    action_work_desc: 'Gundua fursa zilizopo',
    action_buyers: 'Tafuta Wanunuzi',
    action_buyers_desc: 'Ungana na wateja wapya',
    action_business: 'Biashara Yangu',
    action_business_desc: 'Simamia biashara yako',
    action_transactions: 'Malipo Yangu',
    action_transactions_desc: 'Angalia malipo na maagizo',
    recent_activity: 'Shughuli za Hivi Karibuni',
    my_orders: 'Maagizo Yangu',
    new_opportunities: 'Fursa Mpya',
    notifications: 'Matangazo Muhimu',
    get_help: 'Msaada na Usaidizi',
    onboarding_title: 'Sanidi akaunti yako ya ECONEX',
    onboarding_step_language: 'Chagua lugha yako',
    onboarding_step_role: 'Utatumiaje ECONEX?',
    onboarding_step_details: 'Jina lako na wilaya',
    listing_step_product: 'Unauza nini?',
    listing_step_price: 'Weka kiasi na bei sahihi',
    listing_step_publish: 'Weka bidhaa yako sokoni sasa',
    order_status_submitted: 'Inasubiri uthibitisho wa muuzaji',
    order_status_accepted: 'Imekubaliwa na muuzaji',
    order_status_in_transit: 'Njiani kuelekea kwako',
    order_status_delivered: 'Imefikishwa — thibitisha kupokea',
    order_status_completed: 'Imekamilika',
    voice_prompt_hint: 'Ongea au gusa amri',
    voice_read_aloud: 'Soma kwa sauti',
    offline_online: 'Mtandaoni',
    offline_offline: 'Nje ya Mtandao',
    offline_syncing: 'Inalandanisha',
    offline_saved_local: 'Imehifadhiwa kwenye kifaa hiki',
    offline_waiting_sync: 'Inasubiri kulandanishwa',
    offline_sync_failed: 'Ulandanishaji umeshindikana',
    support_open_case: 'Tuma Ombi la Msaada',
    support_case_saved: 'Ombi la msaada limehifadhiwa na nambari ya kesi',
    account_experience_mode: 'Chagua kiwango cha matumizi',
    error_try_again: 'Jaribu Tena',
    status_checking_account: 'Tunakagua akaunti yako',
    status_pay_order: 'Lipia agizo lako',
    status_put_for_sale: 'Weka bidhaa yako sokoni',
    status_check_payment: 'Angalia kama malipo yamepokelewa',
    status_request_goods: 'Omba bidhaa au huduma',
    confirm_payment_notice: 'Tafadhali kagua kiasi kamili, mpokeaji, na mtoa huduma kabla ya kuthibitisha malipo haya.',
    legal_terms_summary: 'Maagizo na makubaliano yanarekodiwa kwa idhini yako chini ya kanuni za kawaida za biashara.',
    settlement_verification_note: 'Malipo huwekwa alama kuwa yamepokelewa tu baada ya uthibitisho kutoka kwa mtoa huduma wako wa malipo.',
    contract_binding_notice: 'Thibitisha tu baada ya kukagua idadi, bei, na masharti ya uwasilishaji.',
  },
  nyn: {
    welcome_greeting: 'Tukushemererwe',
    what_to_do_today: 'Nooyenda kukora ki erizooba?',
    nav_home: 'Omuka',
    nav_explore: 'Sherura',
    nav_activity: 'Emirimo Yangye',
    nav_messages: 'Obutumwa',
    nav_account: 'Akaunti',
    nav_help: 'Obuyambi',
    action_buy: 'Gura',
    action_buy_desc: 'Zoora eby’okugura',
    action_sell: 'Tunda',
    action_sell_desc: 'Teekaho ebintu byawe',
    action_work: 'Sherura Omurimo',
    action_work_desc: 'Reeba emigisha eriho',
    action_buyers: 'Zoora Abaguzi',
    action_buyers_desc: 'Kwatagana n’abaguzi',
    action_business: 'Eby’obushubuzi',
    action_business_desc: 'Kora aha by’obushubuzi bwawe',
    action_transactions: 'Okushashura',
    action_transactions_desc: 'Reeba esente n’ebiragiro',
    recent_activity: 'Ebyakozirwe Hati',
    my_orders: 'Ebiragiro Byangye',
    new_opportunities: 'Emigisha Emisya',
    notifications: 'Ebirango Bikuru',
    get_help: 'Obuyambi',
    onboarding_title: 'Tebeekanisa akaunti yaawe ya ECONEX',
    onboarding_step_language: 'Toorana orurimi rwawe',
    onboarding_step_role: 'Oraakoresa ota ECONEX?',
    onboarding_step_details: 'Eiziina ryawe na disiturikiti',
    listing_step_product: 'Nootunda ki?',
    listing_step_price: 'Taaho obwingi n’omuhendo',
    listing_step_publish: 'Ta ekintu kyawe omu katare hati',
    order_status_submitted: 'Erineereire omutunzi kwikiriza',
    order_status_accepted: 'Omutunzi yaikiriza',
    order_status_in_transit: 'Kiri omu muhanda okuhika ahariiwe',
    order_status_delivered: 'Kyahika — hamya kuwakifuna',
    order_status_completed: 'Kyahwa gye',
    voice_prompt_hint: 'Gamba ninga koona ekiragiro',
    voice_read_aloud: 'Shoma omu iraka',
    offline_online: 'Aha Mutimbagano',
    offline_offline: 'Tihariho Mutimbagano',
    offline_syncing: 'Nikitereezibwa',
    offline_saved_local: 'Kyabiikwa aha kyoma eki',
    offline_waiting_sync: 'Kirindirire okugaitwa',
    offline_sync_failed: 'Okugaita kwanga',
    support_open_case: 'Tuma Okushaba Obuyambi',
    support_case_saved: 'Okushaba obuyambi kwabiikwa n’enamba',
    account_experience_mode: 'Toorana obuteeka bwawe',
    error_try_again: 'Gyezaho Kandi',
    status_checking_account: 'Nitukyebera akaunti yaawe',
    status_pay_order: 'Shashura ekiragiro kyawe',
    status_put_for_sale: 'Ta ekintu kyawe omu katare',
    status_check_payment: 'Reeba yaaba esente zaahika',
    status_request_goods: 'Shaba ebintu ninga obuweereza',
    confirm_payment_notice: 'Bambi kyebera omuhendo oguhikire, orikuheebwa, n’obuweereza otakahamiize kushashura oku.',
    legal_terms_summary: 'Ebiragiro n’endagaano nibihandiikwa ahabw’okwikiriza kwawe omu biragiro by’obushubuzi.',
    settlement_verification_note: 'Okushashura nikuhamibwa ku kwahika bwanyima y’obujurizi kuruga omu muheereza w’esente.',
    contract_binding_notice: 'Hamya bwanyima y’okukyebera obwingi, omuhendo, n’enteekateeka y’okutwara ebintu.',
  },
  ach: {
    welcome_greeting: 'Wajoli',
    what_to_do_today: 'Imito timo ngo tin?',
    nav_home: 'Gang',
    nav_explore: 'Yeny',
    nav_activity: 'Ticca',
    nav_messages: 'Kwena',
    nav_account: 'Akaunt',
    nav_help: 'Kony',
    action_buy: 'Wil',
    action_buy_desc: 'Yeny jami me awila',
    action_sell: 'Cat',
    action_sell_desc: 'Ket jami ni i cuk',
    action_work: 'Yeny Tic',
    action_work_desc: 'Nen kare me tic ma tye',
    action_buyers: 'Yeny Luwil',
    action_buyers_desc: 'Kub ki luwil',
    action_business: 'Biacara Na',
    action_business_desc: 'Lo biacara ni',
    action_transactions: 'Culawa',
    action_transactions_desc: 'Nen lim ki oda',
    recent_activity: 'Tic ma Okato Cokcoki',
    my_orders: 'Oda Mega',
    new_opportunities: 'Kare Manyen',
    notifications: 'Kwena Madongo',
    get_help: 'Kony',
    onboarding_title: 'Yub akaunt ni me ECONEX',
    onboarding_step_language: 'Yer leb ni',
    onboarding_step_role: 'Ibitiyo ki ECONEX nining?',
    onboarding_step_details: 'Nyingi ki dictrict',
    listing_step_product: 'Itye ka cato ngo?',
    listing_step_price: 'Ket wel ki kwan jami',
    listing_step_publish: 'Ket jami ni i cuk kombedi',
    order_status_submitted: 'Tye ka kuro lacat me ye',
    order_status_accepted: 'Lacat oye',
    order_status_in_transit: 'Tye i yoo me bino boti',
    order_status_delivered: 'Oo — mok ni inongo',
    order_status_completed: 'Otyeko maber',
    voice_prompt_hint: 'Lok onyo gony cik',
    voice_read_aloud: 'Kwan ki dwon malongo',
    offline_online: 'Tye i Intanet',
    offline_offline: 'Pe i Intanet',
    offline_syncing: 'Tye ka kubu',
    offline_saved_local: 'Kigwoko i cim man',
    offline_waiting_sync: 'Tye ka kuro kubu',
    offline_sync_failed: 'Kubu okwero',
    support_open_case: 'Cwal Leg me Kony',
    support_case_saved: 'Leg me kony kigwoko ki namba',
    account_experience_mode: 'Yer rwom me tic ni',
    error_try_again: 'Tem Dok',
    status_checking_account: 'Watye ka ngiyo akaunt ni',
    status_pay_order: 'Cul oda ni',
    status_put_for_sale: 'Ket jami ni me acata',
    status_check_payment: 'Ngi ka cul ni oo',
    status_request_goods: 'Leg jami onyo tic',
    confirm_payment_notice: 'Tim ber ikwan wel kikome, ngat ma gamo, ki lami tic ma peya imoko culo man.',
    legal_terms_summary: 'Oda ki gicikke kicoyo ki yee ni i te cik me biacara ma atir.',
    settlement_verification_note: 'Culo kiket ni ogamo keken ka lami tic me lim omoko caden.',
    contract_binding_notice: 'Mok keken ka ityeko ngiyo wel jami, beye, ki cik me tero jami.',
  },
  teo: {
    welcome_greeting: 'Iyalamikinitai',
    what_to_do_today: 'Inyo ekoto ijo aswam lolo?',
    nav_home: 'Ore',
    nav_explore: 'Koom',
    nav_activity: 'Aswamisio ka',
    nav_messages: 'Ekiro',
    nav_account: 'Akaunt',
    nav_help: 'Akiŋarakin',
    action_buy: 'Igiel',
    action_buy_desc: 'Koom iboro luigiela',
    action_sell: 'Igielar',
    action_sell_desc: 'Ibwaikin iboro kon toma osokoni',
    action_work: 'Koom Aswam',
    action_work_desc: 'Anyun arerengu nuka aswam',
    action_buyers: 'Koom Ikagielak',
    action_buyers_desc: 'Imorikikina keda ikagielak',
    action_business: 'Abiacara Ka',
    action_business_desc: 'Idar abiacara kon',
    action_transactions: 'Apesenin Ka',
    action_transactions_desc: 'Koany apesenin ka eoda',
    recent_activity: 'Nuiswama Ikoja',
    my_orders: 'Eoda Ka',
    new_opportunities: 'Arerengu Nukitetiak',
    notifications: 'Ekiro Luyai',
    get_help: 'Akiŋarakin',
    onboarding_title: 'Itemokin akaunt kon ECONEX',
    onboarding_step_language: 'Koseu angajep kon',
    onboarding_step_role: 'Ebiai ijo aitosom ECONEX biai?',
    onboarding_step_details: 'Ekiror kon ka edistrikit',
    listing_step_product: 'Inyo igielari ijo?',
    listing_step_price: 'Ibwaikin eboyo ka etiai',
    listing_step_publish: 'Ibwaikin iboro kon osokoni kwana',
    order_status_submitted: 'Edarit ekagielaran acamun',
    order_status_accepted: 'Acamunit ekagielaran',
    order_status_in_transit: 'Ejai orot ebunit mamakon',
    order_status_delivered: 'Adolok — itogogong adumun',
    order_status_completed: 'Adaun ejok',
    voice_prompt_hint: 'Iner arai kotap akirot',
    voice_read_aloud: 'Kosiom keda eporoto',
    offline_online: 'Ejai Intanet',
    offline_offline: 'Emame Intanet',
    offline_syncing: 'Ejai aimorikikin',
    offline_saved_local: 'Ingaditai toma esimu lo',
    offline_waiting_sync: 'Edarit aimorikikin',
    offline_sync_failed: 'Aimorikikin mam apedori',
    support_open_case: 'Ijuk Akiŋarakino',
    support_case_saved: 'Ingaditai akiŋarakino keda enamba',
    account_experience_mode: 'Koseu epone loitasoma',
    error_try_again: 'Kotema Bobo',
    status_checking_account: 'Kisisiani akaunt kon',
    status_pay_order: 'Kitac eoda kon',
    status_put_for_sale: 'Ibwaikin iboro kon toma osokoni',
    status_check_payment: 'Koany arai adol apesenin',
    status_request_goods: 'Kingit iboro arai aijaanakin',
    confirm_payment_notice: 'Koany etiai loebecokina, loedumuni, keda ekapalan eroko ijo itogogongoni aitac na.',
    legal_terms_summary: 'Eoda keda aicamanar ingaditai keda acamun kon kotoma okisila luka abiacara.',
    settlement_verification_note: 'Aitac itogogongoere ebe adolok naejai atogogongoret naebuni kaneka ekapalan kon.',
    contract_binding_notice: 'Kitogogong bon naedauna ijo aanyun eboyo, etiai, keda ikisila luka aijukar.',
  },
  xog: {
    welcome_greeting: 'Tukusanyukiire',
    what_to_do_today: 'Oyenda kukola ki leero?',
    nav_home: 'Eka',
    nav_explore: 'Noonya',
    nav_activity: 'Emirimu Gyange',
    nav_messages: 'Obubaka',
    nav_account: 'Akawunti',
    nav_help: 'Obuyambi',
    action_buy: 'Gula',
    action_buy_desc: 'Funa ebintu by’okugula',
    action_sell: 'Tunda',
    action_sell_desc: 'Teekayo ebintu byo mu katale',
    action_work: 'Noonya Omulimu',
    action_work_desc: 'Zuula emikisa egy’emirimu',
    action_buyers: 'Noonya Abaguzi',
    action_buyers_desc: 'Yungibwa n’abaguzi',
    action_business: 'Bizinensi Yange',
    action_business_desc: 'Kulembera bizinensi yo',
    action_transactions: 'Okusasula',
    action_transactions_desc: 'Laba ensimbi n’ebiragiro',
    recent_activity: 'Ebyakoleddwa Hati',
    my_orders: 'Ebiragiro Byange',
    new_opportunities: 'Emikisa Emipya',
    notifications: 'Obubaka Obukulu',
    get_help: 'Obuyambi',
    onboarding_title: 'Tegeka akawunti yo eya ECONEX',
    onboarding_step_language: 'Londa olulimi lwo',
    onboarding_step_role: 'Onookozesa otya ECONEX?',
    onboarding_step_details: 'Erina lyo ne disitulikiti',
    listing_step_product: 'Otunda ki?',
    listing_step_price: 'Teeka obungi n’omuwendo',
    listing_step_publish: 'Teeka ekintu kyo mu katale hati',
    order_status_submitted: 'Kirindiridde omutunzi okwikiriza',
    order_status_accepted: 'Omutunzi yaikiriza',
    order_status_in_transit: 'Kiri mu kkubo okutuuka gy’oli',
    order_status_delivered: 'Kituuse — kakasa okufuna',
    order_status_completed: 'Kiwedde bulungi',
    voice_prompt_hint: 'Yogera oba nyiga ekiragiro',
    voice_read_aloud: 'Soma mu iraka',
    offline_online: 'Ku Mutimbagano',
    offline_offline: 'Tewali Mutimbagano',
    offline_syncing: 'Kitereezebwa',
    offline_saved_local: 'Kiterekeddwa ku kyuma kino',
    offline_waiting_sync: 'Kirindiridde okuyungibwa',
    offline_sync_failed: 'Okuyunga kulemye',
    support_open_case: 'Wereza Okusaba Obuyambi',
    support_case_saved: 'Okusaba kwo kuterekeddwa ne namba',
    account_experience_mode: 'Londa obusobozi bw’okukoleramu',
    error_try_again: 'Gezaako Nate',
    status_checking_account: 'Tukebera akawunti yo',
    status_pay_order: 'Sasula ekiragiro kyo',
    status_put_for_sale: 'Teeka ekintu kyo mu katale',
    status_check_payment: 'Kebera oba ensimbi zituuse',
    status_request_goods: 'Saba ebintu oba obuweereza',
    confirm_payment_notice: 'Bambi weekenneenye omuwendo omutuufu, afuna ensimbi, n’omuweereza nga tonnakakasa kusasula kuno.',
    legal_terms_summary: 'Ebiragiro n’endagaano biwandiikibwa olw’okukkiriza kwo wansi w’amateeka g’obusuubuzi amatuufu.',
    settlement_verification_note: 'Okusasula kukakasibwa nga kufuniddwa oluvannyuma lw’obujulizi obuvudde ku muweereza w’ensimbi wo.',
    contract_binding_notice: 'Kakasa oluvannyuma lw’okwekebejja obungi, ebbeeyi, n’enteekateeka y’okutuusa ebintu.',
  },
};

const DYNAMIC_LANGUAGE_PACKS: LanguageMetadata[] = [];

export function getAllLanguagePacks(): LanguageMetadata[] {
  return [...SUPPORTED_LANGUAGES, ...DYNAMIC_LANGUAGE_PACKS];
}

export function registerLanguagePack(
  meta: LanguageMetadata,
  translations: Partial<Record<EconexTranslationKey, string>>
) {
  const idx = DYNAMIC_LANGUAGE_PACKS.findIndex((l) => l.code === meta.code);
  if (idx >= 0) DYNAMIC_LANGUAGE_PACKS[idx] = meta;
  else if (!SUPPORTED_LANGUAGES.some((l) => l.code === meta.code)) {
    DYNAMIC_LANGUAGE_PACKS.push(meta);
  }
  LOCAL_TRANSLATIONS[meta.code] = { ...(LOCAL_TRANSLATIONS[meta.code] || {}), ...translations };
}

export function syncLanguageReviewApproval(code: string, approvedLegal: boolean, reviewerName?: string) {
  const target = SUPPORTED_LANGUAGES.find((l) => l.code === code) || DYNAMIC_LANGUAGE_PACKS.find((l) => l.code === code);
  if (target) {
    target.reviewedLegalFinancial = approvedLegal;
    target.reviewStatus = approvedLegal ? 'VERIFIED_COMPLETE' : 'PARTIAL_COMMUNITY_REVIEW';
    if (reviewerName) target.reviewerName = reviewerName;
  }
}

export function translate(
  lang: string,
  key: EconexTranslationKey
): { text: string; isFallback: boolean; safetyNotice?: string } {
  const all = getAllLanguagePacks();
  const meta = all.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
  if (lang === 'en') {
    return { text: BASE_EN[key], isFallback: false };
  }
  if (SENSITIVE_TRANSLATION_KEYS.has(key) && !meta.reviewedLegalFinancial) {
    return {
      text: BASE_EN[key],
      isFallback: true,
      safetyNotice: 'Displayed in verified English pending formal legal/financial translation sign-off.',
    };
  }
  const translated = LOCAL_TRANSLATIONS[lang]?.[key];
  if (translated) {
    return { text: translated, isFallback: false };
  }
  return { text: BASE_EN[key], isFallback: true };
}

export function getTranslationCompletenessReport(): Array<
  LanguageMetadata & { translatedKeys: number; totalKeys: number; completenessPct: number }
> {
  const totalKeys = Object.keys(BASE_EN).length;
  return getAllLanguagePacks().map((meta) => {
    if (meta.code === 'en') {
      return { ...meta, translatedKeys: totalKeys, totalKeys, completenessPct: 100 };
    }
    const dict = LOCAL_TRANSLATIONS[meta.code] || {};
    const translatedKeys = Object.keys(dict).length;
    return {
      ...meta,
      translatedKeys,
      totalKeys,
      completenessPct: Math.min(100, Math.round((translatedKeys / totalKeys) * 100)),
    };
  });
}

export function formatMoney(amount: number, currency: string, lang: string): string {
  const all = getAllLanguagePacks();
  const meta = all.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
  const n = Number(amount || 0);
  try {
    return `${new Intl.NumberFormat(meta.locale, { maximumFractionDigits: currency === 'UGX' ? 0 : 2 }).format(n)} ${currency}`;
  } catch {
    return `${n.toLocaleString()} ${currency}`;
  }
}

export function formatShortDate(iso: string, lang: string): string {
  const all = getAllLanguagePacks();
  const meta = all.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
  try {
    return new Intl.DateTimeFormat(meta.locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
