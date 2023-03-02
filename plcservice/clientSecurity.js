const socket =require('socket.io-client')

function OPCClientSecurity(self,server_ip,credentials){
    self.clientSocket=socket.socket()
    self.clientSocket.connect((server_ip,5000))

}