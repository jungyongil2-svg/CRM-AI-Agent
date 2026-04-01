import pandas as pd
path=r"c:\Users\jungy\Downloads\캠페인별LMS추출리스트__20260112.xlsx"
df=pd.read_excel(path, sheet_name="Sheet1", header=None)
print('shape', df.shape)
for i in range(min(15, len(df))):
    row=df.iloc[i].tolist()
    print(i, row)
