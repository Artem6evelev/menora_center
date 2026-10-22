import { filterFieldCopy } from "@/components/community/filter-fields";
import { profileFieldCopy } from "@/components/community/profile-fields";
import { childEditorCopy } from "@/components/community/child-editor";
import { cityPickerCopy } from "@/components/community/city-picker";
import { RESOURCE_PARAGRAPHS, COMMUNITY_RESOURCES } from "@/lib/community/copy";

export type MiniAppLanguage = "ru" | "he" | "en";
export function miniAppLanguage(): MiniAppLanguage {
  // Telegram/Mini App is a Russian-only product; metadata is not a preference.
  return "ru";
}
const ru = {
  language: "Язык", loading: "Загружаем ваш кабинет…", retry: "Попробовать ещё раз", brand: "Еврейский дом в Ришон-ле-Ционе",
  openTitle: "Откройте приложение через Telegram", openBody: "Ваш кабинет Menorah Center доступен внутри Telegram. Вернитесь в приложение и откройте его оттуда.",
  errorTitle: "Не удалось открыть кабинет", errorBody: "Проверьте соединение и попробуйте ещё раз. Ваши сохранённые данные остаются на месте.",
  preview: "Локальный тест · синтетический аккаунт", filterTitle: "Добро пожаловать домой", filterIntro: "Давайте познакомимся. Укажите вашу связь с еврейством, чтобы мы могли предложить подходящие программы общины.",
  stepFilter: "Знакомство", stepProfile: "Ваша анкета", next: "Продолжить", profileTitle: "Расскажите о себе", profileIntro: "Несколько слов о вас и вашей семье помогут нам быть ближе. Сохраните основные сведения для профиля общины.",
  editTitle: "Мой профиль", save: "Сохранить анкету", saveEdit: "Сохранить изменения", saving: "Сохраняем…", back: "Назад", changeFilter: "Изменить ответы",
  privacy: "Я соглашаюсь с", privacyLink: "Политикой конфиденциальности", external: " (откроется в новой вкладке)",
  childHint: "Изменения детей сохранятся вместе с анкетой.", childRestricted: "Здесь можно сохранить сведения о себе. Данные детей доступны для самостоятельного добавления только при выполнении правил общины.",
  greeting: "Шалом", homeTitle: "Вы дома", homeBody: "Добро пожаловать в Menorah Center — место для тёплого общения, традиций и добрых дел. Мы рады, что вы с нами.",
  status: "Анкета заполнена", profile: "Мой профиль", contact: "Связаться с Menorah", logout: "Выйти", home: "Главная", account: "Личный кабинет",
  loggedOut: "Вы вышли из кабинета", loginAgain: "Войти снова", resourcesTitle: "Спасибо за ваш интерес", resourcesIntro: "Мы рады вашему стремлению узнать больше о еврейской традиции. Эти ресурсы помогут найти подходящий путь.",
  resourcesLabel: "Ресурсы для интересующихся иудаизмом", resourceParagraphs: RESOURCE_PARAGRAPHS, resourceLabels: COMMUNITY_RESOURCES.map(link => link.label),
  filter: filterFieldCopy, fields: profileFieldCopy, children: childEditorCopy, city: cityPickerCopy,
  unsaved: "В анкете есть несохранённые изменения. Покинуть её?", saved: "Ваши данные сохранены.",
  errors: { generic: "Не удалось сохранить. Проверьте соединение и попробуйте снова — введённые данные сохранены на экране.",
    invalid_profile: "Проверьте обязательные поля, город и данные детей.", profile_changed: "Профиль изменился в другом окне. Ваши записи остаются на экране. Откройте профиль заново перед сохранением.",
    gender_required: "Укажите пол, чтобы продолжить.", filter_required: "Сначала заполните короткую анкету.", unauthenticated: "Не удалось восстановить вход. Откройте приложение заново через Telegram.",
    expired_init_data: "Время входа истекло. Откройте приложение заново через Telegram.", childUnsaved: "Сначала сохраните или отмените изменения в карточке ребёнка.", cityRequired: "Выберите город из справочника." },
};
export type MiniAppCopy = typeof ru;
const en: MiniAppCopy = {
  language: "Language", loading: "Opening your community space…", retry: "Try again", brand: "Your Jewish home in Rishon LeZion",
  openTitle: "Open this app in Telegram", openBody: "Your Menorah Center account is available inside Telegram. Return to Telegram and open the app there.",
  errorTitle: "We couldn't open your account", errorBody: "Check your connection and try again. Your saved information is still there.",
  preview: "Local test · synthetic account", filterTitle: "Welcome home", filterIntro: "Let's get to know each other. Tell us about your connection to Judaism so we can offer suitable community programs.",
  stepFilter: "Getting acquainted", stepProfile: "Your questionnaire", next: "Continue", profileTitle: "Tell us about yourself", profileIntro: "A few details about you and your family help us stay connected. Save the basic details for your community profile.",
  editTitle: "My profile", save: "Save questionnaire", saveEdit: "Save changes", saving: "Saving…", back: "Back", changeFilter: "Change community answers",
  privacy: "I agree to the", privacyLink: "Privacy Policy", external: " (opens in a new tab)",
  childHint: "Changes to children are saved with the questionnaire.", childRestricted: "You can save your own details here. Adding children independently is available only when the community requirements are met.",
  greeting: "Shalom", homeTitle: "You're home", homeBody: "Welcome to Menorah Center — a place for warm connections, traditions and acts of kindness. We're happy you're with us.",
  status: "Questionnaire complete", profile: "My profile", contact: "Contact Menorah", logout: "Log out", home: "Home", account: "Your community space",
  loggedOut: "You have logged out", loginAgain: "Log in again", resourcesTitle: "Thank you for your interest", resourcesIntro: "We're glad you'd like to learn more about Jewish tradition. These resources can help you find your path.",
  resourcesLabel: "Resources for learning about Judaism", resourceParagraphs: [
    "Our community currently focuses on programs for halachically Jewish people and participants in the conversion process.",
    "We appreciate your interest in Judaism.", "To learn more about Jewish tradition, we recommend exploring the Seven Noahide Laws and Noahide communities.",
    "If you are interested in joining the Jewish people through conversion, you can find information about Israel's state conversion program and Nativ's conversion preparation programs." ],
  resourceLabels: ["Seven Noahide Laws and communities", "Israel's state conversion program", "Nativ — conversion preparation"],
  filter: { title: "Your connection to Judaism", categories: { maternal: "Jewish through the maternal line (your mother or maternal grandmother is Jewish)", giyur: "Conversion completed or at an advanced stage", none: "No halachic Jewish status" }, gender: "Gender", male: "Male", female: "Female" },
  fields: { firstName: "First name", lastName: "Last name", phone: "Phone number", dateOfBirth: "Date of birth", city: "City of residence", marital: "Marital status", choose: "Select…", single: "Single", married: "Married", divorced: "Divorced", widowed: "Widowed", spouse: "Spouse's name", hasChildren: "I have children" },
  children: { section: "Children", title: "Children's details", edit: "Edit", remove: "Delete", add: "Add a child", newChild: "New child", editChild: "Edit child", name: "Child's name", birthDate: "Child's date of birth", gender: "Child's gender", male: "Boy", female: "Girl", unknown: "Gender not specified", saving: "Saving…", save: "Save", cancel: "Cancel", invalid: "Enter the child's name, date of birth and gender", error: "Couldn't save the child" },
  city: { error: "Couldn't load the directory. Try again.", loading: "Loading cities…", retry: "Retry", empty: "No matches. Check the spelling.", prompt: "Start typing a city name.", list: "Localities" },
  unsaved: "You have unsaved changes. Leave this questionnaire?", saved: "Your information has been saved.",
  errors: { generic: "Couldn't save. Check your connection and try again — your entries remain on this screen.", invalid_profile: "Check the required fields, city and children's details.", profile_changed: "Your profile changed in another window. Your entries remain here. Reopen the profile before saving.", gender_required: "Choose your gender to continue.", filter_required: "Complete the short questionnaire first.", unauthenticated: "Couldn't restore your login. Reopen the app in Telegram.", expired_init_data: "Your login attempt expired. Reopen the app in Telegram.", childUnsaved: "Save or cancel the changes in the child's card first.", cityRequired: "Select a city from the directory." },
};
const he: MiniAppCopy = {
  language: "שפה", loading: "טוענים את האזור האישי שלך…", retry: "לנסות שוב", brand: "הבית היהודי שלך בראשון לציון",
  openTitle: "פתחו את האפליקציה דרך Telegram", openBody: "האזור האישי של Menorah Center זמין בתוך Telegram. חזרו ל-Telegram ופתחו את האפליקציה משם.",
  errorTitle: "לא הצלחנו לפתוח את האזור האישי", errorBody: "בדקו את החיבור ונסו שוב. הפרטים השמורים שלכם נשמרו.",
  preview: "בדיקה מקומית · חשבון סינתטי", filterTitle: "ברוכים הבאים הביתה", filterIntro: "בואו נכיר. ספרו לנו על הקשר שלכם ליהדות כדי שנוכל להציע תוכניות מתאימות בקהילה.",
  stepFilter: "היכרות", stepProfile: "השאלון שלך", next: "המשך", profileTitle: "ספרו לנו על עצמכם", profileIntro: "כמה פרטים עליכם ועל המשפחה יעזרו לנו להיות בקשר. שמרו את הפרטים הבסיסיים לפרופיל שלכם בקהילה.",
  editTitle: "הפרופיל שלי", save: "שמירת השאלון", saveEdit: "שמירת שינויים", saving: "שומרים…", back: "חזרה", changeFilter: "שינוי התשובות על הקשר ליהדות",
  privacy: "אני מסכים/ה ל", privacyLink: "מדיניות הפרטיות", external: " (ייפתח בלשונית חדשה)",
  childHint: "השינויים בפרטי הילדים יישמרו יחד עם השאלון.", childRestricted: "כאן ניתן לשמור את הפרטים האישיים שלכם. הוספת ילדים באופן עצמאי זמינה רק בהתאם לכללי הקהילה.",
  greeting: "שלום", homeTitle: "אתם בבית", homeBody: "ברוכים הבאים ל-Menorah Center — מקום למפגשים חמים, למסורת ולמעשים טובים. שמחים שאתם איתנו.",
  status: "השאלון הושלם", profile: "הפרופיל שלי", contact: "יצירת קשר עם Menorah", logout: "יציאה", home: "בית", account: "האזור האישי",
  loggedOut: "יצאתם מהאזור האישי", loginAgain: "כניסה מחדש", resourcesTitle: "תודה על ההתעניינות", resourcesIntro: "שמחים שברצונכם ללמוד עוד על המסורת היהודית. המקורות האלה יעזרו לכם למצוא דרך מתאימה.",
  resourcesLabel: "מקורות למתעניינים ביהדות", resourceParagraphs: [
    "הקהילה שלנו מתמקדת בשלב זה בתוכניות ליהודים על פי ההלכה ולמשתתפים בתהליך גיור.", "אנו מעריכים את העניין שלכם ביהדות.",
    "כדי ללמוד עוד על המסורת היהודית, אנו ממליצים להכיר את שבע מצוות בני נח ואת קהילות בני נח.",
    "אם אתם מתעניינים בהצטרפות לעם היהודי באמצעות גיור, תוכלו למצוא מידע על תוכנית הגיור הממלכתית בישראל ועל תוכניות ההכנה לגיור של נתיב." ],
  resourceLabels: ["שבע מצוות וקהילות בני נח", "תוכנית הגיור הממלכתית בישראל", "נתיב — הכנה לגיור"],
  filter: { title: "מהו הקשר שלך ליהדות?", categories: { maternal: "יהדות מצד האם (האמא או הסבתא מצד האם יהודייה)", giyur: "הגיור הושלם או שאני בשלב מתקדם בתהליך", none: "ללא יהדות על פי ההלכה" }, gender: "מגדר", male: "זכר", female: "נקבה" },
  fields: { firstName: "שם פרטי", lastName: "שם משפחה", phone: "מספר טלפון", dateOfBirth: "תאריך לידה", city: "יישוב מגורים", marital: "מצב משפחתי", choose: "בחירה…", single: "רווק/ה", married: "נשוי/אה", divorced: "גרוש/ה", widowed: "אלמן/ה", spouse: "שם בן/בת הזוג", hasChildren: "יש לי ילדים" },
  children: { section: "ילדים", title: "פרטי הילדים", edit: "עריכה", remove: "מחיקה", add: "הוספת ילד/ה", newChild: "ילד/ה חדש/ה", editChild: "עריכת פרטי ילד/ה", name: "שם הילד/ה", birthDate: "תאריך לידת הילד/ה", gender: "מגדר הילד/ה", male: "בן", female: "בת", unknown: "המגדר לא צוין", saving: "שומרים…", save: "שמירה", cancel: "ביטול", invalid: "יש להזין שם, תאריך לידה ומגדר של הילד/ה", error: "לא הצלחנו לשמור את פרטי הילד/ה" },
  city: { error: "לא הצלחנו לטעון את רשימת היישובים. נסו שוב.", loading: "טוענים יישובים…", retry: "ניסיון חוזר", empty: "לא נמצאו תוצאות. בדקו את האיות.", prompt: "התחילו להקליד שם יישוב.", list: "יישובים" },
  unsaved: "יש שינויים שלא נשמרו. לצאת מהשאלון?", saved: "הפרטים שלך נשמרו.",
  errors: { generic: "לא הצלחנו לשמור. בדקו את החיבור ונסו שוב — הפרטים שהזנתם נשארו במסך.", invalid_profile: "בדקו את שדות החובה, היישוב ופרטי הילדים.", profile_changed: "הפרופיל השתנה בחלון אחר. הפרטים שהזנתם נשארו כאן. פתחו מחדש את הפרופיל לפני השמירה.", gender_required: "יש לבחור מגדר כדי להמשיך.", filter_required: "יש להשלים קודם את השאלון על הקשר ליהדות.", unauthenticated: "לא הצלחנו לשחזר את הכניסה. פתחו מחדש את האפליקציה ב-Telegram.", expired_init_data: "תוקף ניסיון הכניסה פג. פתחו מחדש את האפליקציה ב-Telegram.", childUnsaved: "שמרו או בטלו קודם את השינויים בכרטיס הילד/ה.", cityRequired: "יש לבחור יישוב מתוך הרשימה." },
};
export const miniAppDictionaries: Record<MiniAppLanguage, MiniAppCopy> = { ru, he, en };
