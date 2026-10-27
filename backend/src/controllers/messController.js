import MessMenu from '../models/MessMenu.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const getWeeklyMenu = async (req, res, next) => {
  try {
    const menus = await MessMenu.find();
    // Return both array and day-keyed object for frontend convenience
    const menuMap = {};
    DAYS.forEach(day => {
      const match = menus.find(m => m.day === day);
      menuMap[day] = match ? {
        breakfast: match.breakfast,
        lunch: match.lunch,
        dinner: match.dinner,
        _id: match._id
      } : { breakfast: '', lunch: '', dinner: '' };
    });

    res.json({ success: true, data: menuMap, list: menus });
  } catch (error) {
    next(error);
  }
};

export const getTodayMenu = async (req, res, next) => {
  try {
    const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
    const todayName = DAYS[todayIndex];

    const menu = await MessMenu.findOne({ day: todayName });
    res.json({
      success: true,
      day: todayName,
      data: menu || { day: todayName, breakfast: '', lunch: '', dinner: '' }
    });
  } catch (error) {
    next(error);
  }
};

export const updateDayMenu = async (req, res, next) => {
  try {
    const { day } = req.params;
    const { breakfast, lunch, dinner } = req.body;

    let menu = await MessMenu.findOne({ day });
    if (menu) {
      menu.breakfast = breakfast !== undefined ? breakfast : menu.breakfast;
      menu.lunch = lunch !== undefined ? lunch : menu.lunch;
      menu.dinner = dinner !== undefined ? dinner : menu.dinner;
      menu.updatedBy = req.user?._id;
      await menu.save();
    } else {
      menu = await MessMenu.create({
        day,
        breakfast: breakfast || '',
        lunch: lunch || '',
        dinner: dinner || '',
        updatedBy: req.user?._id
      });
    }

    res.json({ success: true, message: `${day}'s menu updated`, data: menu });
  } catch (error) {
    next(error);
  }
};
