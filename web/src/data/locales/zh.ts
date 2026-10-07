import type { DeepPartial, Strings } from './en'

export const zh: DeepPartial<Strings> = {
  locale: {
    short: '中',
    switchTo: '切换到英文',
  },

  nav: {
    primary: '主导航',
    drawer: '移动端导航',
    footer: '页脚导航',
  },

  meta: {
    site: 'Chrollis 的个人主页。',
    projects: '来自 GitHub 的仓库。',
    about: '个人简介与统计数据。',
    blog: '笔记与小说，共 {count} 篇。',
    contact: '联系方式。',
    notFound: '页面不存在。',
  },

  about: {
    statsUnavailable: '统计数据暂不可用。',
  },

  content: {
    description: '雪沫乳花浮午盏，蓼茸蒿笋试春盘。人间有味是清欢。',
    bio: [
      '自我介绍这种东西，真的要坐下来写就写不出来了 (´･ω･`)。写多了别人没那个耐心看，写少了吧，又觉得像在藏着掖着。',
      '这不是我懒嘞，不如说和人打交道这件事挺消耗我的(*>﹏<*)，我心思本来就不多，留着做别的事更划算。不过只要不耽误我的时间、不碰我的事，我这个人还是好说话的。当然，不做点事那也不行，人总得劳动，该我做的我会做完，就是别指望我把身体也搭进去。目前有空的话，主攻明日方舟和终末地，闲着会玩一些小的单机打磨时间，不会死磕学习，内卷伤身的ヾ(≧▽≦*)o。',
      '至于我是怎么样的人，这个就别问了(☆-ｖ-)，我自己答不上来，也不想答。',
    ],
  },

  cover: {
    note: '我的项目和文章都在这儿。',
  },

  projects: {
    intro: '来自 GitHub 的仓库。展开卡片可以看它的 README。',
  },

  blog: {
    intro: '我的笔记和小说都在这里。',
    emptyHint: '还没有发过东西。',
  },

  contact: {
    intro: '与项目相关的事项，请前往对应仓库提交 issue；其他事项，请通过以下渠道联系。',
    notConfiguredHelp: '表单暂时不可用，请改用邮件联系。',
  },

  notFound: {
    body: '此处没有内容。链接可能已失效，或该页面从未存在。',
  },

  crash: {
    title: '出错了。',
    body: '页面渲染失败。刷新后通常可以恢复；若问题反复出现，浏览器控制台中有详细信息。',
  },
}
