import { Config, Render, Version } from '#components'
import { Utils } from '#models'

let memeListCache = {
    memeList: null,
    img: null,
    memeCount: null
};

export class list extends plugin {
    constructor() {
        super({
            name: '清语表情:列表',
            event: 'message',
            priority: -Infinity,
            rule: [
                {
                    reg: /^#?(?:(清语)?表情|meme(?:-plugin)?)列表$/i,
                    fnc: 'list'
                }
            ]
        });
    }

    async list(e) {
        if (!Config.meme.enable) return false;
        try {
            // 获取最新的表情包键列表
            const keys = await Utils.Tools.getAllKeys();
            // 计算最新的表情包数量
            const currentMemeCount = keys ? keys.length : 0;

            // 检查缓存是否有效
            if (memeListCache.memeList && memeListCache.img && memeListCache.memeCount === currentMemeCount) {
                await e.reply(memeListCache.img);
                return true;
            }

            if (!keys || keys.length === 0) {
                await e.reply(`[${Version.Plugin_AliasName}]没有找到表情列表, 请使用[#清语表情更新资源], 稍后再试`, true);
                return true;
            }

            const tasks = keys.map(async (key) => {
                const keyWords = await Utils.Tools.getKeyWords(key) ?? null;
                const params = await Utils.Tools.getParams(key) ?? null;

                const { min_texts = 0, min_images = 0, args_type = null } = params;

                const types = [];
                if (min_texts >= 1) types.push('text');
                if (min_images >= 1) types.push('image');
                if (args_type !== null) types.push('arg');

                if (keyWords) {
                    return keyWords.map(keyword => ({
                        name: keyword,
                        types
                    }));
                }

                return [];
            });

            const memeList = (await Promise.all(tasks)).flat();
            const total = memeList.length;

            const img = await Render.render(
                'list/index',
                {
                    memeList,
                    total
                }
            );

            // 更新缓存
            memeListCache = {
                memeList,
                img,
                memeCount: currentMemeCount
            };

            await e.reply(img);
            return true;
        } catch (error) {
            logger.error('加载表情列表失败:', error);
            await e.reply('加载表情列表失败，请稍后重试', true);
            return true;
        }
    }
}
