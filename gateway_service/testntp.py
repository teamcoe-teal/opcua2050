import ntplib
from datetime import datetime, timezone
c = ntplib.NTPClient()
response = c.request('192.168.1.149', version=3)
response.offset
print (datetime.fromtimestamp(response.tx_time))
  



