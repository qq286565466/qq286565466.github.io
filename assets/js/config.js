(() => {
  "use strict";

  // 常用基础参数集中在这里。修改后刷新页面即可生效。
  // game.js 负责执行规则；config.js 只负责提供可调数值。
  const config = {
    match: {
      // 每名玩家开局获得的手牌数。
      startingHandSize: 2,

      // AI 行动前的思考停顿，单位毫秒。数值越小节奏越快。
      aiThinkMs: 2000,

      // 每隔多少个完整轮次抽取一次新场地。
      fieldEveryRounds: 5,

      // 新存档 / 管理员重置时使用的默认星石。
      startingBalance: 2000
    },

    // 房间参数：baseBet=底注，minBalance=入场最低星石，ai=AI难度。
    rooms: {
      beginner: {
        id: "beginner", name: "新手场", baseBet: 20, minBalance: 0,
        ai: { key: "relaxed", label: "休闲", mistakeRate: 0.42, scoreNoise: 18, topChoices: 3, awareness: 0.50, skillFactor: 0.78 }
      },
      normal: {
        id: "normal", name: "普通场", baseBet: 100, minBalance: 500,
        ai: { key: "standard", label: "标准", mistakeRate: 0.14, scoreNoise: 7, topChoices: 2, awareness: 0.82, skillFactor: 1.00 }
      },
      advanced: {
        id: "advanced", name: "高级场", baseBet: 500, minBalance: 2000,
        ai: { key: "expert", label: "高手", mistakeRate: 0.025, scoreNoise: 1.8, topChoices: 1, awareness: 1.00, skillFactor: 1.12 }
      }
    }
  };

  // 防止运行中的逻辑意外改写配置；需要调整时直接编辑本文件。
  Object.freeze(config.match);
  for (const room of Object.values(config.rooms)) {
    Object.freeze(room.ai);
    Object.freeze(room);
  }
  Object.freeze(config.rooms);
  window.GAME_CONFIG = Object.freeze(config);
})();
