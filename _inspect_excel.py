import pandas as pd
path=r"c:\Users\jungy\Downloads\캠페인별LMS추출리스트__20260112.xlsx"
xl=pd.ExcelFile(path)
print('sheets:', xl.sheet_names)
df=xl.parse(xl.sheet_names[0])
print('columns:', list(df.columns))
print('rows:', len(df))
print(df.head(3).to_string(index=False))
