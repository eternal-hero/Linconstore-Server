export type PriceToPlan = {
    name : string,
    key: string | undefined;
}
export const priceToPlan : PriceToPlan []= [
    {
        name: 'BasicMonthly',
        key: process.env.BASICMONTHLY
    },
    {
        name: 'BasicYearly',
        key: process.env.BASICYEARLY
    },
    {
        name: 'EssentialYearly',
        key:  process.env.ESSENTIALYEARLY
    },
    {
        name: 'EssentialMonthly',
        key:  process.env.ESSENTIALMONTHLY
    },
    {
        name: 'PremiumMonthly',
        key:   process.env.PREMIUMMONTHLY
    },
    {
        name: 'PremiumYearly',
        key:   process.env.PREMIUMYEARLY
    }
]

interface IStorePlan {
    plan: string,
    limit: number,
    restriction: string []
}
export const storePlan : IStorePlan []= [
    {
        plan: 'basic',
        limit: 5,
        restriction: ['tools']
    },
    {
        plan: 'essential',
        limit: 10,
        restriction: []
    }, {
    plan: 'premium',
        limit: 50,
        restriction: []
    }
    ]