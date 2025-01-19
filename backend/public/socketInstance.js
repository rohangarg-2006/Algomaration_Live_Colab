let socket;

export function getSocketInstance() {
  if (!socket) {
    socket = io(); 
  }
  return socket;
}
