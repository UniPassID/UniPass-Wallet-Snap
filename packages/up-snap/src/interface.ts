export type SignRequest = {
  message: string;
  from: string;
};

export type MessageRequest = {
  method: string;
  params?: SignRequest;
};

export type RpcRequest = {
  origin: string;
  request: MessageRequest;
};