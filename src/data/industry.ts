/** Frozen industry series. $ billions unless noted.
 *  marketCap: Fed Z.1 L.224 public corporate equities (LM883164115), listed-US $ — Wilshire universe.
 *  hf*: Fed EFA all Form PF hedge funds (all_hedge_funds_balance_sheet.csv) through 2025:Q4.
 *  passivePct: ICI 2026 Fact Book Fig 2.6 index domestic equity MF+ETF / US stocks; 2012–14 backcast 1pp/year from 2015=11.
 *  citEquity: 60% of ICI total CIT AUM (2026 CIT paper, annual interpolated). Null before 2015.
 *  Vintage: Z.1 2026:Q2 release; EFA 2025:Q4; ICI Fact Book 2026.
 */
export const INDUSTRY_VINTAGE = "2012:Q4–2025:Q4 · frozen Sep 2026";

export type IndustryRow = {
  date: string;
  year: number;
  q: number;
  marketCap: number;
  hfAssets: number;
  hfNav: number;
  hfStocks: number;
  hfDeriv: number;
  passivePct: number;
  citEquity: number | null;
};

export const INDUSTRY: IndustryRow[] = [
  { date: "2012Q4", year: 2012, q: 4, marketCap: 18658.4, hfAssets: 4254.2, hfNav: 2420.0, hfStocks: 1148.5, hfDeriv: 8311.8, passivePct: 8, citEquity: null },
  { date: "2013Q1", year: 2013, q: 1, marketCap: 20609.3, hfAssets: 4730.0, hfNav: 2592.3, hfStocks: 1292.5, hfDeriv: 5901.3, passivePct: 8.25, citEquity: null },
  { date: "2013Q2", year: 2013, q: 2, marketCap: 21011.7, hfAssets: 4852.7, hfNav: 2634.5, hfStocks: 1332.5, hfDeriv: 4845.6, passivePct: 8.5, citEquity: null },
  { date: "2013Q3", year: 2013, q: 3, marketCap: 22162.5, hfAssets: 4999.4, hfNav: 2750.6, hfStocks: 1424.3, hfDeriv: 4931.3, passivePct: 8.75, citEquity: null },
  { date: "2013Q4", year: 2013, q: 4, marketCap: 24144.8, hfAssets: 5351.1, hfNav: 3056.1, hfStocks: 1618.2, hfDeriv: 5253.1, passivePct: 9, citEquity: null },
  { date: "2014Q1", year: 2014, q: 1, marketCap: 24578.9, hfAssets: 5544.4, hfNav: 3106.9, hfStocks: 1661.0, hfDeriv: 5260.6, passivePct: 9.25, citEquity: null },
  { date: "2014Q2", year: 2014, q: 2, marketCap: 25728.2, hfAssets: 5778.9, hfNav: 3267.4, hfStocks: 1775.4, hfDeriv: 5167.0, passivePct: 9.5, citEquity: null },
  { date: "2014Q3", year: 2014, q: 3, marketCap: 25557.9, hfAssets: 5884.4, hfNav: 3242.3, hfStocks: 1743.0, hfDeriv: 5306.1, passivePct: 9.75, citEquity: null },
  { date: "2014Q4", year: 2014, q: 4, marketCap: 26690.8, hfAssets: 5926.0, hfNav: 3360.8, hfStocks: 1810.1, hfDeriv: 4655.5, passivePct: 10, citEquity: null },
  { date: "2015Q1", year: 2015, q: 1, marketCap: 26862.8, hfAssets: 6350.4, hfNav: 3535.5, hfStocks: 1887.1, hfDeriv: 5087.5, passivePct: 10.25, citEquity: null },
  { date: "2015Q2", year: 2015, q: 2, marketCap: 26686.2, hfAssets: 6277.1, hfNav: 3551.9, hfStocks: 1975.0, hfDeriv: 4668.8, passivePct: 10.5, citEquity: null },
  { date: "2015Q3", year: 2015, q: 3, marketCap: 24557.4, hfAssets: 6192.0, hfNav: 3447.4, hfStocks: 1800.2, hfDeriv: 4934.3, passivePct: 10.75, citEquity: null },
  { date: "2015Q4", year: 2015, q: 4, marketCap: 25712.0, hfAssets: 6037.1, hfNav: 3444.1, hfStocks: 1830.6, hfDeriv: 4607.1, passivePct: 11, citEquity: 1522.2 },
  { date: "2016Q1", year: 2016, q: 1, marketCap: 25548.0, hfAssets: 6063.1, hfNav: 3359.9, hfStocks: 1726.5, hfDeriv: 5060.3, passivePct: 11.25, citEquity: 1567.6 },
  { date: "2016Q2", year: 2016, q: 2, marketCap: 26074.4, hfAssets: 6241.2, hfNav: 3403.1, hfStocks: 1695.3, hfDeriv: 5232.8, passivePct: 11.5, citEquity: 1613.1 },
  { date: "2016Q3", year: 2016, q: 3, marketCap: 26999.8, hfAssets: 6399.5, hfNav: 3467.0, hfStocks: 1821.2, hfDeriv: 5415.6, passivePct: 11.75, citEquity: 1658.5 },
  { date: "2016Q4", year: 2016, q: 4, marketCap: 27914.1, hfAssets: 6409.9, hfNav: 3501.3, hfStocks: 1824.8, hfDeriv: 5137.5, passivePct: 12, citEquity: 1704.0 },
  { date: "2017Q1", year: 2017, q: 1, marketCap: 29403.9, hfAssets: 6697.6, hfNav: 3585.8, hfStocks: 1962.4, hfDeriv: 5620.6, passivePct: 12.25, citEquity: 1738.5 },
  { date: "2017Q2", year: 2017, q: 2, marketCap: 30201.0, hfAssets: 6823.8, hfNav: 3647.9, hfStocks: 2017.7, hfDeriv: 5459.8, passivePct: 12.5, citEquity: 1773.0 },
  { date: "2017Q3", year: 2017, q: 3, marketCap: 31346.0, hfAssets: 7076.1, hfNav: 3746.3, hfStocks: 2130.6, hfDeriv: 6013.1, passivePct: 12.75, citEquity: 1807.5 },
  { date: "2017Q4", year: 2017, q: 4, marketCap: 33170.2, hfAssets: 7177.8, hfNav: 3881.4, hfStocks: 2273.2, hfDeriv: 6588.1, passivePct: 13, citEquity: 1842.0 },
  { date: "2018Q1", year: 2018, q: 1, marketCap: 32809.8, hfAssets: 7357.4, hfNav: 3932.1, hfStocks: 2256.9, hfDeriv: 9668.7, passivePct: 13.0, citEquity: 1841.8 },
  { date: "2018Q2", year: 2018, q: 2, marketCap: 33892.9, hfAssets: 7590.2, hfNav: 3978.0, hfStocks: 2305.2, hfDeriv: 8131.8, passivePct: 13.0, citEquity: 1841.7 },
  { date: "2018Q3", year: 2018, q: 3, marketCap: 35841.5, hfAssets: 7732.6, hfNav: 3997.9, hfStocks: 2330.1, hfDeriv: 6539.7, passivePct: 13.0, citEquity: 1841.5 },
  { date: "2018Q4", year: 2018, q: 4, marketCap: 30542.0, hfAssets: 7487.3, hfNav: 3755.3, hfStocks: 1979.4, hfDeriv: 6297.7, passivePct: 13, citEquity: 1841.4 },
  { date: "2019Q1", year: 2019, q: 1, marketCap: 34395.2, hfAssets: 7864.1, hfNav: 3912.5, hfStocks: 2200.9, hfDeriv: 7381.3, passivePct: 13.75, citEquity: 1953.8 },
  { date: "2019Q2", year: 2019, q: 2, marketCap: 35691.4, hfAssets: 8100.7, hfNav: 3988.6, hfStocks: 2262.7, hfDeriv: 7484.9, passivePct: 14.5, citEquity: 2066.1 },
  { date: "2019Q3", year: 2019, q: 3, marketCap: 35764.6, hfAssets: 7958.4, hfNav: 3982.3, hfStocks: 2168.6, hfDeriv: 7525.7, passivePct: 15.25, citEquity: 2178.4 },
  { date: "2019Q4", year: 2019, q: 4, marketCap: 38526.6, hfAssets: 8113.2, hfNav: 4097.6, hfStocks: 2378.5, hfDeriv: 7337.4, passivePct: 16, citEquity: 2290.8 },
  { date: "2020Q1", year: 2020, q: 1, marketCap: 30576.7, hfAssets: 7628.6, hfNav: 3715.1, hfStocks: 1787.5, hfDeriv: 6798.5, passivePct: 15.75, citEquity: 2401.8 },
  { date: "2020Q2", year: 2020, q: 2, marketCap: 37269.0, hfAssets: 7682.2, hfNav: 4038.1, hfStocks: 2141.4, hfDeriv: 6191.0, passivePct: 15.5, citEquity: 2512.8 },
  { date: "2020Q3", year: 2020, q: 3, marketCap: 40764.5, hfAssets: 8118.3, hfNav: 4257.0, hfStocks: 2352.0, hfDeriv: 7643.8, passivePct: 15.25, citEquity: 2623.8 },
  { date: "2020Q4", year: 2020, q: 4, marketCap: 47014.7, hfAssets: 8466.1, hfNav: 4500.3, hfStocks: 2757.6, hfDeriv: 7653.9, passivePct: 15, citEquity: 2734.8 },
  { date: "2021Q1", year: 2021, q: 1, marketCap: 50311.4, hfAssets: 8558.1, hfNav: 4619.4, hfStocks: 2898.4, hfDeriv: 8560.7, passivePct: 15.5, citEquity: 2875.0 },
  { date: "2021Q2", year: 2021, q: 2, marketCap: 54829.5, hfAssets: 9225.3, hfNav: 4940.7, hfStocks: 3164.8, hfDeriv: 8881.5, passivePct: 16.0, citEquity: 3015.3 },
  { date: "2021Q3", year: 2021, q: 3, marketCap: 54865.6, hfAssets: 9620.4, hfNav: 5035.0, hfStocks: 3070.4, hfDeriv: 8892.3, passivePct: 16.5, citEquity: 3155.5 },
  { date: "2021Q4", year: 2021, q: 4, marketCap: 59448.1, hfAssets: 9682.7, hfNav: 5106.6, hfStocks: 3191.4, hfDeriv: 8543.9, passivePct: 17, citEquity: 3295.8 },
  { date: "2022Q1", year: 2022, q: 1, marketCap: 56167.0, hfAssets: 9978.5, hfNav: 5410.5, hfStocks: 3031.5, hfDeriv: 9219.7, passivePct: 17.25, citEquity: 3166.3 },
  { date: "2022Q2", year: 2022, q: 2, marketCap: 46675.2, hfAssets: 9288.0, hfNav: 4778.7, hfStocks: 2542.5, hfDeriv: 7908.4, passivePct: 17.5, citEquity: 3036.9 },
  { date: "2022Q3", year: 2022, q: 3, marketCap: 44410.0, hfAssets: 9084.4, hfNav: 4704.5, hfStocks: 2446.9, hfDeriv: 7839.6, passivePct: 17.75, citEquity: 2907.4 },
  { date: "2022Q4", year: 2022, q: 4, marketCap: 46982.2, hfAssets: 9121.0, hfNav: 4682.2, hfStocks: 2523.7, hfDeriv: 7543.7, passivePct: 18, citEquity: 2778.0 },
  { date: "2023Q1", year: 2023, q: 1, marketCap: 49927.6, hfAssets: 9407.8, hfNav: 4805.0, hfStocks: 2609.8, hfDeriv: 8002.1, passivePct: 18.0, citEquity: 2918.7 },
  { date: "2023Q2", year: 2023, q: 2, marketCap: 53641.8, hfAssets: 9822.6, hfNav: 4851.3, hfStocks: 2707.3, hfDeriv: 8196.1, passivePct: 18.0, citEquity: 3059.4 },
  { date: "2023Q3", year: 2023, q: 3, marketCap: 51662.3, hfAssets: 10142.0, hfNav: 4878.0, hfStocks: 2665.9, hfDeriv: 8798.5, passivePct: 18.0, citEquity: 3200.1 },
  { date: "2023Q4", year: 2023, q: 4, marketCap: 57440.9, hfAssets: 10704.1, hfNav: 4956.6, hfStocks: 2811.0, hfDeriv: 9133.4, passivePct: 18, citEquity: 3340.8 },
  { date: "2024Q1", year: 2024, q: 1, marketCap: 62742.5, hfAssets: 10954.9, hfNav: 5104.2, hfStocks: 3014.8, hfDeriv: 10090.0, passivePct: 18.0, citEquity: 3452.4 },
  { date: "2024Q2", year: 2024, q: 2, marketCap: 64639.8, hfAssets: 11104.8, hfNav: 5071.9, hfStocks: 3050.2, hfDeriv: 10408.1, passivePct: 18.0, citEquity: 3564.0 },
  { date: "2024Q3", year: 2024, q: 3, marketCap: 68755.4, hfAssets: 11947.5, hfNav: 5261.3, hfStocks: 3205.2, hfDeriv: 12009.7, passivePct: 18.0, citEquity: 3675.6 },
  { date: "2024Q4", year: 2024, q: 4, marketCap: 70647.9, hfAssets: 11846.9, hfNav: 5240.2, hfStocks: 3277.9, hfDeriv: 10400.8, passivePct: 18, citEquity: 3787.2 },
  { date: "2025Q1", year: 2025, q: 1, marketCap: 67587.3, hfAssets: 12464.9, hfNav: 5307.4, hfStocks: 3185.9, hfDeriv: 11542.9, passivePct: 18.25, citEquity: 3859.5 },
  { date: "2025Q2", year: 2025, q: 2, marketCap: 74733.0, hfAssets: 13316.8, hfNav: 5536.1, hfStocks: 3564.3, hfDeriv: 12184.1, passivePct: 18.5, citEquity: 3931.8 },
  { date: "2025Q3", year: 2025, q: 3, marketCap: 80885.1, hfAssets: 13712.0, hfNav: 5739.5, hfStocks: 3774.5, hfDeriv: 12690.4, passivePct: 18.75, citEquity: 4004.1 },
  { date: "2025Q4", year: 2025, q: 4, marketCap: 83151.2, hfAssets: 14221.1, hfNav: 5918.0, hfStocks: 3982.3, hfDeriv: 13544.0, passivePct: 19, citEquity: 4076.4 },
];
