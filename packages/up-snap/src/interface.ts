export type SignRequest = {
  message: string;
  from: string;
};

export type MessageRequest = {
  method: string;
  params?: SignRequest;
};

export type RpcReqeust = {
  origin: string;
  request: MessageRequest;
};