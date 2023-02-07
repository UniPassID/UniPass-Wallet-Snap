import { FetchProps, SyncTransactionInput } from '../interface';

const API_VERSION_PREFIX = '/api/v1';

async function syncTransaction(data: SyncTransactionInput, props?: FetchProps) {
  
  const res = await fetch(
    `${props.backend + API_VERSION_PREFIX}/sync/transaction`,
    {
      body: JSON.stringify(data),
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${props?.oauthUserInfo.authorization}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return res.json();
}

export default {
  syncTransaction,
};
