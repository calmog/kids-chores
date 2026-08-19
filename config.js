/* ---------------------------------------------------------------------------
   config.js — the only file you need to edit to change chores.
   After editing, bump CACHE_VERSION in sw.js so her phone picks up the change.
   --------------------------------------------------------------------------- */

const CONFIG = {

  // 'he' or 'en'. Controls UI language and text direction.
  lang: 'he',

  // Girl's name, shown in the header. Empty string hides it.
  kidName: '',

  /* -------------------------------------------------------------------------
     THE ROTATION — one per day, strictly in this order, looping forever.
     She does not choose. The pointer moves only when she acts.

       weight     how much work it is. Used ONLY to gate substitutions:
                  a bonus chore may replace it only if bonus.points >= weight.
                  Rotation chores earn NO points.
       skippable  true = she may declare there's nothing to do, which jumps
                  to the next chore THAT SAME DAY (never a day off).
     ------------------------------------------------------------------------- */
  rotation: [
    { id: 'fold',       weight: 5,  skippable: true,
      he: 'לקפל כביסה',              en: 'Fold laundry',
      skipHe: 'אין כביסה לקפל',      skipEn: 'Nothing to fold' },

    { id: 'hang',       weight: 5,  skippable: true,
      he: 'לתלות כביסה',             en: 'Hang laundry',
      skipHe: 'אין כביסה לתלות',     skipEn: 'Nothing to hang' },

    { id: 'declutter',  weight: 8,  skippable: false,
      he: 'לסדר את הבית ולהוציא זבל', en: 'Tidy up + take out trash' },

    { id: 'dishes',     weight: 10, skippable: false,
      he: 'לשטוף כלים',              en: 'Do the dishes' },

    { id: 'vacuum',     weight: 10, skippable: false,
      he: 'לשאוב אבק',               en: 'Vacuum' },

    { id: 'sheets_her', weight: 8,  skippable: false,
      he: 'להחליף מצעים במיטה שלה',   en: 'Change her bedsheets' },

    { id: 'sheets_par', weight: 8,  skippable: true,
      he: 'להחליף מצעים אצל ההורים',  en: "Change parents' bedsheets",
      skipHe: 'לא צריך השבוע',       skipEn: 'Not needed this week' },
  ],

  /* -------------------------------------------------------------------------
     BONUS CHORES — the only things that earn points.
     Two ways to use one:
       1. as an EXTRA, any time, on top of the day's chore  -> +points
       2. as a SUBSTITUTE for today's chore, allowed only when
          points >= today's weight. The replaced chore is NOT consumed —
          it is still waiting tomorrow. Substituting buys a night off,
          it never deletes a chore.
     ------------------------------------------------------------------------- */
  bonus: [
    { id: 'mirror', points: 5,  he: 'לנקות את המראה באמבטיה', en: 'Clean the bathroom mirror' },
    { id: 'toilet', points: 5,  he: 'לנקות את האסלה',          en: 'Clean the toilet' },
    { id: 'mop',    points: 10, he: 'לשטוף רצפה (מגב + מגבון)', en: 'Mop the floor (wet wipe)' },
  ],

  /* -------------------------------------------------------------------------
     REWARDS — what points buy. Privileges, not cash. Edit freely.
     These are placeholders: change the names and costs to whatever
     you actually want to hand out.
     ------------------------------------------------------------------------- */
  rewards: [
    { id: 'screen30',  cost: 20, he: '30 דקות מסך נוספות',      en: '30 min extra screen time' },
    { id: 'dinner',    cost: 30, he: 'לבחור מה אוכלים בערב',     en: 'Pick what’s for dinner' },
    { id: 'bedtime',   cost: 40, he: 'שעה מאוחרת יותר בסופ״ש',   en: 'Later bedtime at the weekend' },
    { id: 'movie',     cost: 60, he: 'לבחור סרט לערב משפחתי',    en: 'Pick the family movie' },
  ],
};
