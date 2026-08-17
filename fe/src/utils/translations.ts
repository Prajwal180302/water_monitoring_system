import type { LanguageOption } from './appSettings';

type TranslationKey =
  | 'waterMonitoring'
  | 'quickNavigation'
  | 'quickNavigationSubtitle'
  | 'smartNavigation'
  | 'active'
  | 'home'
  | 'alerts'
  | 'prediction'
  | 'reports'
  | 'settings'
  | 'liveDashboard'
  | 'criticalUpdates'
  | 'aiForecast'
  | 'analyticsView'
  | 'systemControls'
  | 'settingsTitle'
  | 'settingsSubtitle'
  | 'dashboardName'
  | 'settingsIntro'
  | 'saveChanges'
  | 'saving'
  | 'account'
  | 'accountSubtitle'
  | 'fullName'
  | 'email'
  | 'language'
  | 'phoneNumber'
  | 'addUpdatePhone'
  | 'enterPhoneNumber'
  | 'logout'
  | 'preferences'
  | 'preferencesSubtitle'
  | 'notifications'
  | 'darkMode'
  | 'liveTimeDisplay'
  | 'temperatureUnit'
  | 'layoutDensity'
  | 'connectivity'
  | 'connectivitySubtitle'
  | 'systemConfiguration'
  | 'systemConfigurationSubtitle'
  | 'phoneAdded'
  | 'phoneAlreadyAdded'
  | 'phoneAddedButton'
  | 'saveProfile'
  | 'savingProfile'
  | 'profileAdded'
  | 'profileAlreadyAdded'
  | 'settingsSaved'
  | 'loginTitle'
  | 'loginSubtitle'
  | 'welcomeBack'
  | 'deviceOrEmail'
  | 'deviceOrEmailPlaceholder'
  | 'password'
  | 'rememberMe'
  | 'forgotPassword'
  | 'login'
  | 'loggingIn'
  | 'noAccount'
  | 'signup'
  | 'resetPassword'
  | 'newPassword'
  | 'backToLogin'
  | 'resetPasswordSuccess'
  | 'resetPasswordButton';

const translations: Record<LanguageOption, Record<TranslationKey, string>> = {
  en: {
    waterMonitoring: 'Water Monitoring',
    quickNavigation: 'Quick Navigation',
    quickNavigationSubtitle: 'Move between monitoring, alerts, AI insights, reports, and configuration.',
    smartNavigation: 'Smart navigation',
    active: 'Active',
    home: 'Home',
    alerts: 'Alerts',
    prediction: 'Prediction',
    reports: 'Reports',
    settings: 'Settings',
    liveDashboard: 'Live dashboard',
    criticalUpdates: 'Critical updates',
    aiForecast: 'AI forecast',
    analyticsView: 'Analytics view',
    systemControls: 'System controls',
    settingsTitle: 'System Configuration',
    settingsSubtitle: 'Configure system preferences and operational parameters with ease',
    dashboardName: 'IoT Water Monitoring Dashboard',
    settingsIntro: 'Manage account, preferences, connectivity, and device behavior from one place.',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    account: 'Account',
    accountSubtitle: 'Profile, language, and access controls',
    fullName: 'Full Name',
    email: 'Email',
    language: 'Language',
    phoneNumber: 'Phone Number',
    addUpdatePhone: 'Add / Update Phone',
    enterPhoneNumber: 'Enter Phone Number',
    logout: 'Logout',
    preferences: 'Preferences',
    preferencesSubtitle: 'Notifications, theme, clock, and display options',
    notifications: 'Notifications',
    darkMode: 'Dark Mode',
    liveTimeDisplay: 'Live Time Display',
    temperatureUnit: 'Temperature Unit',
    layoutDensity: 'Layout Density',
    connectivity: 'Connectivity',
    connectivitySubtitle: 'Network settings and device information',
    systemConfiguration: 'System Configuration',
    systemConfigurationSubtitle: 'Thresholds, calibration, sampling, and device status',
    phoneAdded: 'Added successfully.',
    phoneAlreadyAdded: 'Number already added.',
    phoneAddedButton: 'Added',
    saveProfile: 'Save Profile',
    savingProfile: 'Saving profile...',
    profileAdded: 'Added successfully.',
    profileAlreadyAdded: 'Profile already added.',
    settingsSaved: 'Settings saved successfully.',
    loginTitle: 'AquaMonitor',
    loginSubtitle: 'Water Monitoring System',
    welcomeBack: 'Welcome Back',
    deviceOrEmail: 'Device ID or Email',
    deviceOrEmailPlaceholder: 'Enter Device ID or Email',
    password: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    login: 'Login',
    loggingIn: 'Logging in...',
    noAccount: "Don't have an account?",
    signup: 'Signup',
    resetPassword: 'Reset Password',
    newPassword: 'New Password',
    backToLogin: 'Back to login',
    resetPasswordSuccess: 'Password reset successfully. You can log in now.',
    resetPasswordButton: 'Update Password',
  },
  hi: {
    waterMonitoring: 'जल निगरानी',
    quickNavigation: 'त्वरित नेविगेशन',
    quickNavigationSubtitle: 'मॉनिटरिंग, अलर्ट, AI जानकारी, रिपोर्ट और कॉन्फ़िगरेशन के बीच जाएं।',
    smartNavigation: 'स्मार्ट नेविगेशन',
    active: 'सक्रिय',
    home: 'होम',
    alerts: 'अलर्ट',
    prediction: 'पूर्वानुमान',
    reports: 'रिपोर्ट',
    settings: 'सेटिंग्स',
    liveDashboard: 'लाइव डैशबोर्ड',
    criticalUpdates: 'महत्वपूर्ण अपडेट',
    aiForecast: 'AI पूर्वानुमान',
    analyticsView: 'विश्लेषण दृश्य',
    systemControls: 'सिस्टम नियंत्रण',
    settingsTitle: 'सिस्टम कॉन्फ़िगरेशन',
    settingsSubtitle: 'सिस्टम पसंद और संचालन मानकों को आसानी से कॉन्फ़िगर करें',
    dashboardName: 'IoT जल निगरानी डैशबोर्ड',
    settingsIntro: 'खाता, पसंद, कनेक्टिविटी और डिवाइस व्यवहार एक जगह प्रबंधित करें।',
    saveChanges: 'बदलाव सहेजें',
    saving: 'सहेजा जा रहा है...',
    account: 'खाता',
    accountSubtitle: 'प्रोफ़ाइल, भाषा और एक्सेस नियंत्रण',
    fullName: 'पूरा नाम',
    email: 'ईमेल',
    language: 'भाषा',
    phoneNumber: 'फोन नंबर',
    addUpdatePhone: 'फोन जोड़ें / अपडेट करें',
    enterPhoneNumber: 'फोन नंबर दर्ज करें',
    logout: 'लॉगआउट',
    preferences: 'पसंद',
    preferencesSubtitle: 'सूचनाएं, थीम, घड़ी और डिस्प्ले विकल्प',
    notifications: 'सूचनाएं',
    darkMode: 'डार्क मोड',
    liveTimeDisplay: 'लाइव समय प्रदर्शन',
    temperatureUnit: 'तापमान इकाई',
    layoutDensity: 'लेआउट घनत्व',
    connectivity: 'कनेक्टिविटी',
    connectivitySubtitle: 'नेटवर्क सेटिंग्स और डिवाइस जानकारी',
    systemConfiguration: 'सिस्टम कॉन्फ़िगरेशन',
    systemConfigurationSubtitle: 'थ्रेशोल्ड, कैलिब्रेशन, सैंपलिंग और डिवाइस स्थिति',
    phoneAdded: 'सफलतापूर्वक जोड़ा गया।',
    phoneAlreadyAdded: 'नंबर पहले से जोड़ा गया है।',
    phoneAddedButton: 'जोड़ा गया',
    saveProfile: 'प्रोफ़ाइल सहेजें',
    savingProfile: 'प्रोफ़ाइल सहेजी जा रही है...',
    profileAdded: 'सफलतापूर्वक जोड़ा गया।',
    profileAlreadyAdded: 'प्रोफ़ाइल पहले से जोड़ी गई है।',
    settingsSaved: 'सेटिंग्स सफलतापूर्वक सहेजी गईं।',
    loginTitle: 'AquaMonitor',
    loginSubtitle: 'जल निगरानी प्रणाली',
    welcomeBack: 'वापसी पर स्वागत है',
    deviceOrEmail: 'डिवाइस ID या ईमेल',
    deviceOrEmailPlaceholder: 'डिवाइस ID या ईमेल दर्ज करें',
    password: 'पासवर्ड',
    rememberMe: 'मुझे याद रखें',
    forgotPassword: 'पासवर्ड भूल गए?',
    login: 'लॉगिन',
    loggingIn: 'लॉगिन हो रहा है...',
    noAccount: 'खाता नहीं है?',
    signup: 'साइनअप',
    resetPassword: 'पासवर्ड रीसेट करें',
    newPassword: 'नया पासवर्ड',
    backToLogin: 'लॉगिन पर वापस जाएं',
    resetPasswordSuccess: 'पासवर्ड सफलतापूर्वक रीसेट हुआ। अब लॉगिन करें।',
    resetPasswordButton: 'पासवर्ड अपडेट करें',
  },
  mr: {
    waterMonitoring: 'जल निरीक्षण',
    quickNavigation: 'जलद नेव्हिगेशन',
    quickNavigationSubtitle: 'मॉनिटरिंग, अलर्ट, AI माहिती, रिपोर्ट आणि कॉन्फिगरेशनमध्ये जा.',
    smartNavigation: 'स्मार्ट नेव्हिगेशन',
    active: 'सक्रिय',
    home: 'मुख्यपृष्ठ',
    alerts: 'अलर्ट',
    prediction: 'अंदाज',
    reports: 'रिपोर्ट',
    settings: 'सेटिंग्ज',
    liveDashboard: 'लाइव्ह डॅशबोर्ड',
    criticalUpdates: 'महत्त्वाचे अपडेट',
    aiForecast: 'AI अंदाज',
    analyticsView: 'विश्लेषण दृश्य',
    systemControls: 'सिस्टम नियंत्रण',
    settingsTitle: 'सिस्टम कॉन्फिगरेशन',
    settingsSubtitle: 'सिस्टम प्राधान्ये आणि ऑपरेशनल पॅरामीटर्स सहज कॉन्फिगर करा',
    dashboardName: 'IoT जल निरीक्षण डॅशबोर्ड',
    settingsIntro: 'खाते, प्राधान्ये, कनेक्टिव्हिटी आणि डिवाइस वर्तन एका ठिकाणी व्यवस्थापित करा.',
    saveChanges: 'बदल जतन करा',
    saving: 'जतन होत आहे...',
    account: 'खाते',
    accountSubtitle: 'प्रोफाइल, भाषा आणि अॅक्सेस नियंत्रण',
    fullName: 'पूर्ण नाव',
    email: 'ईमेल',
    language: 'भाषा',
    phoneNumber: 'फोन नंबर',
    addUpdatePhone: 'फोन जोडा / अपडेट करा',
    enterPhoneNumber: 'फोन नंबर टाका',
    logout: 'लॉगआउट',
    preferences: 'प्राधान्ये',
    preferencesSubtitle: 'सूचना, थीम, घड्याळ आणि डिस्प्ले पर्याय',
    notifications: 'सूचना',
    darkMode: 'डार्क मोड',
    liveTimeDisplay: 'लाइव्ह वेळ प्रदर्शन',
    temperatureUnit: 'तापमान युनिट',
    layoutDensity: 'लेआउट घनता',
    connectivity: 'कनेक्टिव्हिटी',
    connectivitySubtitle: 'नेटवर्क सेटिंग्ज आणि डिवाइस माहिती',
    systemConfiguration: 'सिस्टम कॉन्फिगरेशन',
    systemConfigurationSubtitle: 'थ्रेशोल्ड, कॅलिब्रेशन, सॅम्पलिंग आणि डिवाइस स्थिती',
    phoneAdded: 'यशस्वीरित्या जोडले.',
    phoneAlreadyAdded: 'नंबर आधीच जोडला आहे.',
    phoneAddedButton: 'जोडले',
    saveProfile: 'प्रोफाइल जतन करा',
    savingProfile: 'प्रोफाइल जतन होत आहे...',
    profileAdded: 'यशस्वीरित्या जोडले.',
    profileAlreadyAdded: 'प्रोफाइल आधीच जोडले आहे.',
    settingsSaved: 'सेटिंग्ज यशस्वीरित्या जतन झाल्या.',
    loginTitle: 'AquaMonitor',
    loginSubtitle: 'जल निरीक्षण प्रणाली',
    welcomeBack: 'पुन्हा स्वागत आहे',
    deviceOrEmail: 'डिवाइस ID किंवा ईमेल',
    deviceOrEmailPlaceholder: 'डिवाइस ID किंवा ईमेल टाका',
    password: 'पासवर्ड',
    rememberMe: 'मला लक्षात ठेवा',
    forgotPassword: 'पासवर्ड विसरलात?',
    login: 'लॉगिन',
    loggingIn: 'लॉगिन होत आहे...',
    noAccount: 'खाते नाही?',
    signup: 'साइनअप',
    resetPassword: 'पासवर्ड रीसेट करा',
    newPassword: 'नवीन पासवर्ड',
    backToLogin: 'लॉगिनवर परत जा',
    resetPasswordSuccess: 'पासवर्ड यशस्वीरित्या रीसेट झाला. आता लॉगिन करा.',
    resetPasswordButton: 'पासवर्ड अपडेट करा',
  },
};

export const translate = (language: LanguageOption, key: TranslationKey) => translations[language]?.[key] ?? translations.en[key];
