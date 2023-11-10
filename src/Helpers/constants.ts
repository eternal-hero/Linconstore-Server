interface IAdsLimit  {
    plan : string,
    limit: number
}
export const adsLimit : IAdsLimit [] = [
    {
        plan: 'free',
        limit: 5
    },
    {
        plan: 'Premium',
        limit: 20
    }
]
export const CountryCodes : {country: string, code: string}[] = [
    {
    country : 'Australia',
        code: 'AU'
    }, {
        country: 'Austria',
        code: 'AT'
    },{
        country: 'Belgium',
        code: 'BE'
    }, {
        country: 'Bulgaria',
        code: 'BG'
    }, {
        country: 'Canada',
        code: 'CA'
    }, {
    country: 'Croatia',
        code: 'HR'
    }, {
    country : 'Cyprus',
        code: 'CY'
    }, {
    country: 'Czech',
        code: 'CZ'
    }, {
    country: 'Denmark',
        code: 'DK'
    }, {
    country: 'Estonia',
        code: 'EE'
    }, {
        country: 'Finland',
        code: 'FI'
    }, {
    country: 'France',
        code: 'FR'
    }, {
    country: 'Germany',
        code: 'DE'
    }, {
        country: 'Greece',
        code: 'GR'
    }, {
    country: 'Hungary',
        code: 'HU'
    }, {
    country: 'Ireland',
        code: 'IE'
    }, {
    country: 'Italy',
        code: 'IT'
    }, {
    country: 'Lithuania',
        code: 'LT'
    }, {
    country: 'Luxembourg',
        code: 'LU'
    }, {
    country: 'Mexico',
        code: 'MX'
    }, {
        country: 'Netherlands',
        code: 'NL'
    }, {
    country: 'New Zealand',
        code: 'NZ'
    }, {
    country: 'Norway',
        code: 'NO'
    }, {
    country: 'Poland',
        code: 'PL'
    }, {
    country: 'Portugal',
        code: 'PT'
    }, {
        country: 'Spain',
        code: 'ES'
    }, {
        country: 'Sweden',
        code: 'SE'
    }, {
        country: 'Switzerland',
        code: 'CH'
    }, {
    country: 'United Kingdom',
            code : 'UK'
    }, {
    country: 'United States',
        code: 'US'
    }


]