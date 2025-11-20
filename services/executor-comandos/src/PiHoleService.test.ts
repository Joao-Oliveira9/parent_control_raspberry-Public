import { json } from 'sequelize';
import {
  create_session,
  delete_session,
  get_id_group,
  verificar_dominio,
  verificando_cliente,
  addDomainBlockList,
  unblockDomain,
  create_group,
  create_client,
  remove_client_group,
  remove_group,
  remove_client,
  insert_client_in_group
} from './PiHoleService'
import { exec } from 'child_process';

global.fetch = jest.fn();

const mockSignal = {
    aborted: false,
    onabort: null,
} as unknown as AbortSignal

describe('Testando request de queries do Pi Hole', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation();
    })

    describe('Criando sessão', () => {
        it('criando com sucesso', async() => {

            const mockData = {
                session: {
                    sid: 'teste123',
                    message: 'Authentication successful'
                }
            };
        
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            const result = await create_session();

            expect(result).toEqual('teste123');
        });

        it('verificando ok = false', async() => {

            (fetch as jest.Mock).mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({})
            })

            const result = await create_session();
            expect(result).toBe('');

            expect(console.error).toHaveBeenCalledWith('Failed to create session');

        });

        it('Erro ao criar sessão', async() => {

            const mockData = {
                session: {
                    sid: null,
                    message: 'no auth for local user'
                }
            };

            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            
            const result = await create_session();
            expect(result).toBe("");

            expect(console.error).toHaveBeenCalledWith('no auth for local user');

        });

        it('Erro ao criar sessão', async() => {

            const mockData = {
                error: {
                    message: 'No valid JSON payload found'
                }
            };

            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            
            const result = await create_session();
            expect(result).toBe("");

            expect(console.error).toHaveBeenCalledWith('No valid JSON payload found');

        });

        it('Erro try-catch', async() => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Network Request Failed'));

            const result = await create_session();
            expect(result).toBe('');

            expect(console.error).toHaveBeenCalledWith('Error creating session:', expect.any(Error));
        });
    })

    describe('Deletando sessão', () => {
        it('deletando com sucesso', async() => {
        
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({})
            })

            await delete_session('teste123');
            expect(fetch).toHaveBeenCalledWith(
                "http://192.168.0.21/api/auth?sid=teste123",
                {"headers": {"Content-Type": "application/json"}, "method": "DELETE"}
            );

            expect(fetch).toHaveBeenCalled();
        });

        it('verificando ok = false', async() => {

            (fetch as jest.Mock).mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({})
            })

            await delete_session('teste123');
            expect(fetch).toHaveBeenCalled();

            expect(console.error).toHaveBeenCalledWith('Failed to delete session');

        });

        it('Erro try-catch', async() => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Network Request Failed'));

            await delete_session('teste123');

            expect(console.error).toHaveBeenCalledWith('Error deleting session:', expect.any(Error));
        });
    });

    describe('Verificando domínio', () => {
        it('domínio encontrado com grupos', async() => {
        const mockData = {
            domains: [
            { domain: 'facebook.com', groups: [1, 2] },
            { domain: 'youtube.com', groups: [2] }
            ]
        };

        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockData)
        })

        const [existe, grupos] = await verificar_dominio('facebook.com', 'teste123');
        expect(existe).toBe(true);
        expect(grupos).toEqual([1, 2]);
        });

        it('ok = false', async() => {
            const mockData = {
                domains: [
                    { domain: 'facebook.com', groups: [1, 2] },
                    { domain: 'youtube.com', groups: [2] }
                ]
            };

            (fetch as jest.Mock).mockResolvedValue({
                ok: false,
                json: () => Promise.resolve(mockData)
            })

            const [existe, grupos] = await verificar_dominio('facebook.com', 'teste123');
            
            expect(console.error).toHaveBeenCalledWith('Failed to verify domain');

            expect(existe).toBe(false);
            expect(grupos).toEqual([]);

        });

        it('dominio vazio', async() => {
            const mockData = {
                domains: []
            };

            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            const [existe, grupos] = await verificar_dominio('facebook.com', 'teste123');
            
            expect(existe).toBe(false);
            expect(grupos).toEqual([]);

        });

        it('try-catch', async() => {
            (fetch as jest.Mock).mockRejectedValue(new Error('Network Request Failed'));

            const [existe, grupos] = await verificar_dominio('facebook.com', 'teste123');
            
            expect(existe).toBe(false);
            expect(grupos).toEqual([-1]);
            
            expect(console.error).toHaveBeenCalledWith('Error verifying domain:', expect.any(Error));
        })

  });

  describe('Pegando id do grupo', () => {
    it('pegando o id com sucesso', async() => {
        const mockData = {
            groups: [
                {
                    "name": 'teste',
                    "id": 21
                }
            ]
        };

        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockData)
        })

        const result = await get_id_group('teste123','teste');
        expect(result).toBe(21);

    });

    it('ok = false', async() => {
        const mockData = {
            groups: [
                {
                    "name": 'teste',
                    "id": 21
                }
            ]
        };

        (fetch as jest.Mock).mockResolvedValue({
            ok: false,
            json: () => Promise.resolve(mockData)
        })

        const result = await get_id_group('teste123','teste');

        expect(console.error).toHaveBeenCalledWith('Failed to get groups');
        expect(result).toBe(-1);

    });

    it('try-catch', async() => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Network Request Failed'));

        const result = await get_id_group('teste123', 'teste');
        expect(result).toEqual(-1);
        expect(console.error).toHaveBeenCalledWith('Error getting group ID:', expect.any(Error));
    })
  });

   describe('Verificando cliente', () => {
        it('cliente encontrado com grupos', async() => {
            const mockData = {
                clients: [
                    { client: 'FF:FF:FF:FF:FF:FF', groups: [1, 2] },
                    { client: 'AA:AA:AA:AA:AA:AA', groups: [2] }
                ]
            };

            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            const {existe, grupos} = await verificando_cliente('teste123', 'FF:FF:FF:FF:FF:FF');
            
            expect(existe).toBe(true);
            expect(grupos).toEqual([1, 2]);
        });

        it('ok = false', async() => {
            const mockData = {
                clients: [
                    { client: 'FF:FF:FF:FF:FF:FF', groups: [1, 2] },
                    { client: 'AA:AA:AA:AA:AA:AA', groups: [2] }
                ]
            };

            (fetch as jest.Mock).mockResolvedValue({
                ok: false,
                json: () => Promise.resolve(mockData)
            })

            const {existe, grupos} = await verificando_cliente('teste123', 'FF:FF:FF:FF:FF:FF');
            
            expect(console.error).toHaveBeenCalledWith('Failed to get clients');

            expect(existe).toBe(false);
            expect(grupos).toEqual([-1]);

        });

        it('cliente vazio', async() => {
            const mockData = {
                clients: []
            };

            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            const {existe, grupos} = await verificando_cliente('teste123', 'FF:FF:FF:FF:FF:FF');
            
            expect(existe).toBe(false);
            expect(grupos).toEqual([]);

        });

        it('try-catch', async() => {
            (fetch as jest.Mock).mockRejectedValue(new Error('Network Request Failed'));

            const {existe, grupos} = await verificando_cliente('teste123', 'FF:FF:FF:FF:FF:FF');
            
            expect(existe).toBe(false);
            expect(grupos).toEqual([-1]);
            
            expect(console.error).toHaveBeenCalledWith('Error getting client groups:', expect.any(Error));
        });

  });

  describe('bloqueando site', () => {
        it('site bloqueado com sucesso', async() => {

            (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    sid: 'teste123',
                    message: 'Authentication successful'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    groups: [{ name: 'teste', id: 21 }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    domains: [
                        { domain: 'facebook.com', groups: [1, 2] },
                        { domain: 'youtube.com', groups: [2] }
                    ]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });

            const result = await addDomainBlockList('facebook.com', 'teste');
            expect(result).toBe(true);

            expect(fetch).toHaveBeenCalledTimes(4);

        });

        it('ok = false', async() => {
           
            (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    sid: 'teste123',
                    message: 'Authentication successful'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    groups: [{ name: 'teste', id: 21 }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    domains: [
                        { domain: 'facebook.com', groups: [1, 2] },
                        { domain: 'youtube.com', groups: [2] }
                    ]
                })
            })
            .mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({})
            });

            const result = await addDomainBlockList('facebook.com', 'teste');
            expect(console.error).toHaveBeenCalledWith('Failed to update domain groups')
            expect(result).toBe(false);

            expect(fetch).toHaveBeenCalledTimes(4);

        });

        it('ok = false, dominio não existe', async() => {
           
            (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    sid: 'teste123',
                    message: 'Authentication successful'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    groups: [{ name: 'teste', id: 21 }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    domains: [
                        { domain: 'facebook.com', groups: [1, 2] },
                        { domain: 'youtube.com', groups: [2] }
                    ]
                })
            })
            .mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({})
            });

            const result = await addDomainBlockList('uol.com.br', 'teste');
            expect(console.error).toHaveBeenCalledWith('Failed to add domain to block list')
            expect(result).toBe(false);

            expect(fetch).toHaveBeenCalledTimes(4);

        });

        it('dominio não existe sucesso', async() => {
           
            (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    sid: 'teste123',
                    message: 'Authentication successful'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    groups: [{ name: 'teste', id: 21 }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    domains: [
                        { domain: 'facebook.com', groups: [1, 2] },
                        { domain: 'youtube.com', groups: [2] }
                    ]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });

            const result = await addDomainBlockList('uol.com.br', 'teste');
            expect(result).toBe(true);

            expect(fetch).toHaveBeenCalledTimes(4);

        });

        it('try-catch', async() => {
            (fetch as jest.Mock).mockRejectedValue(new Error('Network Request Failed'));

            const result = await addDomainBlockList('uol.com.br', 'teste');
            expect(result).toBe(false);

            expect(console.error).toHaveBeenCalledWith('Error creating session:', expect.any(Error));
            expect(console.error).toHaveBeenCalledWith('Error getting group ID:', expect.any(Error));
            expect(console.error).toHaveBeenCalledWith('Error verifying domain:', expect.any(Error));
        });
        
         it('try-catch', async() => {
           (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    sid: 'teste123',
                    message: 'Authentication successful'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    groups: [{ name: 'teste', id: 21 }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    domains: [
                        { domain: 'facebook.com', groups: [1, 2] },
                        { domain: 'youtube.com', groups: [2] }
                    ]
                })
            })
            .mockRejectedValue(new Error('Network Request Failed'));

            const result = await addDomainBlockList('uol.com.br', 'teste');
            expect(result).toBe(false);

            expect(console.error).toHaveBeenCalledWith('Error adding domain to block list:', expect.any(Error));
            
        });

  });

    describe('desbloqueando site', () => {
        it('site desbloqueado com sucesso', async() => {

            (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    sid: 'teste123',
                    message: 'Authentication successful'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    groups: [{ name: 'teste', id: 21 }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    domains: [
                        { domain: 'facebook.com', groups: [1, 2, 21] },
                        { domain: 'youtube.com', groups: [2] }
                    ]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });

            const result = await unblockDomain('facebook.com', 'teste');
            expect(result).toBe(true);

            expect(fetch).toHaveBeenCalledTimes(4);

        });

        it('ok = false', async() => {
           
            (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    sid: 'teste123',
                    message: 'Authentication successful'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    groups: [{ name: 'teste', id: 21 }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    domains: [
                        { domain: 'facebook.com', groups: [1, 2, 21] },
                        { domain: 'youtube.com', groups: [2] }
                    ]
                })
            })
            .mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({})
            });

            const result = await unblockDomain('facebook.com', 'teste');
            expect(console.error).toHaveBeenCalledWith('Failed to update domain groups')
            expect(result).toBe(false);

            expect(fetch).toHaveBeenCalledTimes(4);

        });

        it('dominio não existe', async() => {
           
            (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    sid: 'teste123',
                    message: 'Authentication successful'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    groups: [{ name: 'teste', id: 21 }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    domains: [
                        { domain: 'facebook.com', groups: [1, 2, 21] },
                        { domain: 'youtube.com', groups: [2] }
                    ]
                })
            })

            const result = await unblockDomain('uol.com.br', 'teste');
            expect(result).toBe(false);

            expect(fetch).toHaveBeenCalledTimes(3);

        });

        it('quando novo grupo é vazio', async() => {
           
            (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    sid: 'teste123',
                    message: 'Authentication successful'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    groups: [{ name: 'teste', id: 21 }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    domains: [
                        { domain: 'facebook.com', groups: [21] }
                    ]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });

            const result = await unblockDomain('facebook.com', 'teste');
            expect(result).toBe(true);

            const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
            expect(lastCall[0]).toEqual(expect.stringMatching(/\/domains\/deny\/exact\/facebook\.com\?sid=/));
            expect(lastCall[1].method).toBe('DELETE');

            expect(fetch).toHaveBeenCalledTimes(4);

        });

        it('quando novo grupo é vazio, ok = false', async() => {
           
            (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    sid: 'teste123',
                    message: 'Authentication successful'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    groups: [{ name: 'teste', id: 21 }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    domains: [
                        { domain: 'facebook.com', groups: [21] }
                    ]
                })
            })
            .mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({})
            });

            const result = await unblockDomain('facebook.com', 'teste');

            expect(console.error).toHaveBeenCalledWith('Failed to remove domain from block list');
            expect(result).toBe(false);

            expect(fetch).toHaveBeenCalledTimes(4);

        });

        it('try-catch', async () => {
            (fetch as jest.Mock).mockRejectedValue(new Error('Network Request Failed'));

            const result = await unblockDomain('facebook.com.br', 'teste');

            expect(console.error).toHaveBeenCalledWith(
                'Error creating session:',
                expect.any(Error)
            );
            expect(console.error).toHaveBeenCalledWith(
                'Error getting group ID:',
                expect.any(Error)
            );
            expect(console.error).toHaveBeenCalledWith(
                'Error verifying domain:',
                expect.any(Error)
            );

            expect(result).toBe(false);
        });

  });

  describe('Criando grupo', () => {
    
    it('criando grupo com sucesso', async() => {
        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                sid: 'teste123',
                message: 'Authentication successful'
            })
        })
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                processed:{
                    errors:[]
                }
            })
        });

        const [sucesso, grupo_existe] = await create_group('teste');
        expect(sucesso).toBe(true);
        expect(grupo_existe).toBe(false);

        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('criando grupo com sucesso', async() => {
        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                sid: 'teste123',
                message: 'Authentication successful'
            })
        })
        .mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({
                processed:{
                    errors:[]
                }
            })
        });

        const [sucesso, grupo_existe] = await create_group('teste');
        expect(sucesso).toBe(false);
        expect(grupo_existe).toBe(false);

        expect(console.error).toHaveBeenCalledWith('Failed to create group');

        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('criando grupo com sucesso', async() => {
        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                sid: 'teste123',
                message: 'Authentication successful'
            })
        })
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                processed:{
                    errors:[
                        {error: 'UNIQUE constraint failed: group.name'}
                    ]
                }
            })
        });

        const [sucesso, grupo_existe] = await create_group('teste');
        expect(sucesso).toBe(false);
        expect(grupo_existe).toBe(true);

        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('criando grupo com sucesso', async() => {
        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                sid: 'teste123',
                message: 'Authentication successful'
            })
        })
        .mockRejectedValue(new Error('Network Request Failed'));

        const [sucesso, grupo_existe] = await create_group('teste');
        expect(sucesso).toBe(false);
        expect(grupo_existe).toBe(false);

        expect(console.error).toHaveBeenCalledWith('Error creating group:', expect.any(Error))

        expect(fetch).toHaveBeenCalledTimes(2);
    });

  })

  describe('Criando cliente', () => {
    
    it('criando cliente com sucesso', async() => {
        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                sid: 'teste123',
                message: 'Authentication successful'
            })
        })
        .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    clients: [
                        { client: 'AA:AA:AA:AA:AA:AA', groups: [] }
                    ]
                })
            })
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                processed:{
                    errors:[]
                }
            })
        });

        const result = await create_client('AA:AA:AA:AA:AA:AA', 21);
        expect(result).toBe(true);

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/clients/AA:AA:AA:AA:AA:AA\\?sid=`));
        expect(lastCall[1].method).toBe('PUT');

        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('criando cliente com sucesso, clientes = 0', async() => {
        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                sid: 'teste123',
                message: 'Authentication successful'
            })
        })
        .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    clients: []
                })
            })
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                processed:{
                    errors:[]
                }
            })
        });

        const result = await create_client('AA:AA:AA:AA:AA:AA', 21);
        expect(result).toBe(true);

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/clients\\?sid=`));
        expect(lastCall[1].method).toBe('POST');

        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('criando cliente com sucesso, ok = false', async() => {
        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                sid: 'teste123',
                message: 'Authentication successful'
            })
        })
        .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    clients: [
                        { client: 'AA:AA:AA:AA:AA:AA', groups: [] }
                    ]
                })
            })
        .mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({
                processed:{
                    errors:[]
                }
            })
        });

        const result = await create_client('AA:AA:AA:AA:AA:AA', 21);
        expect(result).toBe(false);

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/clients/AA:AA:AA:AA:AA:AA\\?sid=`));
        expect(lastCall[1].method).toBe('PUT');

        expect(console.error).toHaveBeenCalledWith('Failed to update client groups')

        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('criando cliente com sucesso, clientes = 0 com ok = false', async() => {
        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                sid: 'teste123',
                message: 'Authentication successful'
            })
        })
        .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    clients: []
                })
            })
        .mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({
                processed:{
                    errors:[]
                }
            })
        });

        const result = await create_client('FF:FF:FF:FF:FF:FF', 21);
        expect(result).toBe(false);

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/clients\\?sid=`));
        expect(lastCall[1].method).toBe('POST');

        expect(console.error).toHaveBeenCalledWith('Failed to create client')

        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('try-catch', async() => {
        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                sid: 'teste123',
                message: 'Authentication successful'
            })
        })
        .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    clients: []
                })
            })
        .mockRejectedValue(new Error('Network Request Failed'));

        const result = await create_client('AA:AA:AA:AA:AA:AA', 21);
        expect(result).toBe(false);

        expect(console.error).toHaveBeenCalledWith('Error creating client:', expect.any(Error))

        expect(fetch).toHaveBeenCalledTimes(3);
    });

  })

  describe('Removendo cliente do grupo', () => {
    it('removendo com sucesso', async() => {

        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                domains: [
                    {domain:'facebook.com', type:'deny', kind:'exact', groups: [1,2]},
                    {domain:'youtube.com', type:'deny', kind:'exact', groups: [1]},
                    {domain:'uol.com.br', type:'deny', kind:'exact', groups: [3, 21]}
                ]
           })
        })
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({})
        })

        const result = await remove_client_group('teste123', 21)
        expect(result).toBe(true);

        const firstCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 2];
        expect(firstCall[0]).toMatch(new RegExp(`/domains/deny\\?sid=`));
        expect(firstCall[1].method).toBe('GET');

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/domains/deny/exact/uol.com.br\\?sid=`));
        expect(lastCall[1].method).toBe('PUT');

        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('get response com ok = false', async() => {

        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({})
        });

        const result = await remove_client_group('teste123', 21)
        expect(result).toBe(false);

        const firstCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(firstCall[0]).toMatch(new RegExp(`/domains/deny\\?sid=`));
        expect(firstCall[1].method).toBe('GET');

        expect(console.error).toHaveBeenCalledWith('Failed to get blocked domains');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('put response com ok = false', async() => {

        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                domains: [
                    {domain:'facebook.com', type:'deny', kind:'exact', groups: [1,2]},
                    {domain:'youtube.com', type:'deny', kind:'exact', groups: [1]},
                    {domain:'uol.com.br', type:'deny', kind:'exact', groups: [3, 21]}
            ]})
        })
        .mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({})
        })

        const result = await remove_client_group('teste123', 21)
        expect(result).toBe(false);

        const firstCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 2];
        expect(firstCall[0]).toMatch(new RegExp(`/domains/deny\\?sid=`));
        expect(firstCall[1].method).toBe('GET');

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/domains/deny/exact/uol.com.br\\?sid=`));
        expect(lastCall[1].method).toBe('PUT');

        expect(console.error).toHaveBeenCalledWith('Failed to update domain groups');
        expect(fetch).toHaveBeenCalledTimes(2);
    });

     it('try-catch', async() => {
        (fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                domains: [
                    {domain:'facebook.com', type:'deny', kind:'exact', groups: [1,2]},
                    {domain:'youtube.com', type:'deny', kind:'exact', groups: [1]},
                    {domain:'uol.com.br', type:'deny', kind:'exact', groups: [3, 21]}
            ]})
        })
        .mockRejectedValue(new Error('Network Request Failed'));

        const result = await remove_client_group('teste123', 21)
        expect(result).toBe(false);

        const firstCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 2];
        expect(firstCall[0]).toMatch(new RegExp(`/domains/deny\\?sid=`));
        expect(firstCall[1].method).toBe('GET');

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/domains/deny/exact/uol.com.br\\?sid=`));
        expect(lastCall[1].method).toBe('PUT');

        expect(console.error).toHaveBeenCalledWith('Error removing client from group:', expect.any(Error))

        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('try-catch', async() => {
        (fetch as jest.Mock)
        .mockRejectedValue(new Error('Network Request Failed'));

        const result = await remove_client_group('teste123', 21)
        expect(result).toBe(false);

        const firstCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(firstCall[0]).toMatch(new RegExp(`/domains/deny\\?sid=`));
        expect(firstCall[1].method).toBe('GET');

        expect(console.error).toHaveBeenCalledWith('Error removing client from group:', expect.any(Error))

        expect(fetch).toHaveBeenCalledTimes(1);
    });

  });

  describe('Removendo grupo', () => {
    it('removendo grupo com sucesso', async() => {
        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/AA:AA:AA:AA:AA:AA')) {
                expect(options.method).toBe('PUT'); // opcional para checar
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/groups/teste')) {
                expect(options.method).toBe('DELETE');
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        const result = await remove_group('teste', ['AA:AA:AA:AA:AA:AA', 'FF:FF:FF:FF:FF:FF']);
        expect(result).toBe(true);

        const calls = (fetch as jest.Mock).mock.calls;

        const putAA = calls.find(c => c[0].includes('/clients/AA:AA:AA:AA:AA:AA') && c[1].method === 'PUT');
        const putFF = calls.find(c => c[0].includes('/clients/FF:FF:FF:FF:FF:FF') && c[1].method === 'PUT');
        const deleteGroup = calls.find(c => c[0].includes('/groups/teste') && c[1].method === 'DELETE');

        expect(putAA).toBeDefined();
        expect(putFF).toBeDefined();
        expect(deleteGroup).toBeDefined();

        expect(fetch).toHaveBeenCalledTimes(8);
    });

    it('removendo grupo, primeiro cliente com ok = false', async() => {
        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/AA:AA:AA:AA:AA:AA')) {
                expect(options.method).toBe('PUT'); // opcional para checar
                return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
            }
        });

        const result = await remove_group('teste', ['AA:AA:AA:AA:AA:AA', 'FF:FF:FF:FF:FF:FF']);
        expect(result).toBe(false);

        const calls = (fetch as jest.Mock).mock.calls;

        const putAA = calls.find(c => c[0].includes('/clients/AA:AA:AA:AA:AA:AA') && c[1].method === 'PUT');
        
        expect(putAA).toBeDefined();
        expect(console.error).toHaveBeenCalledWith('Failed to update client groups')

        expect(fetch).toHaveBeenCalledTimes(5);
    });

    it('removendo grupo, segundo cliente com ok = false', async() => {
        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/AA:AA:AA:AA:AA:AA')) {
                expect(options.method).toBe('PUT'); // opcional para checar
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
            }
        });

        const result = await remove_group('teste', ['AA:AA:AA:AA:AA:AA', 'FF:FF:FF:FF:FF:FF']);
        expect(result).toBe(false);

        const calls = (fetch as jest.Mock).mock.calls;

        const putAA = calls.find(c => c[0].includes('/clients/AA:AA:AA:AA:AA:AA') && c[1].method === 'PUT');
        const putFF = calls.find(c => c[0].includes('/clients/FF:FF:FF:FF:FF:FF') && c[1].method === 'PUT');
    
        expect(putAA).toBeDefined();
        expect(putFF).toBeDefined();

        expect(console.error).toHaveBeenCalledWith('Failed to update client groups')

        expect(fetch).toHaveBeenCalledTimes(7);
    });

    it('removendo grupo, delete com ok = false', async() => {
        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/AA:AA:AA:AA:AA:AA')) {
                expect(options.method).toBe('PUT'); // opcional para checar
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/groups/teste')) {
                expect(options.method).toBe('DELETE');
                return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
            }
        });

        const result = await remove_group('teste', ['AA:AA:AA:AA:AA:AA', 'FF:FF:FF:FF:FF:FF']);
        expect(result).toBe(false);

        const calls = (fetch as jest.Mock).mock.calls;

        const putAA = calls.find(c => c[0].includes('/clients/AA:AA:AA:AA:AA:AA') && c[1].method === 'PUT');
        const putFF = calls.find(c => c[0].includes('/clients/FF:FF:FF:FF:FF:FF') && c[1].method === 'PUT');
        const deleteGroup = calls.find(c => c[0].includes('/groups/teste') && c[1].method === 'DELETE');

        expect(putAA).toBeDefined();
        expect(putFF).toBeDefined();
        expect(deleteGroup).toBeDefined();

        expect(console.error).toHaveBeenCalledWith('Failed to delete group')

        expect(fetch).toHaveBeenCalledTimes(8);
    });

    it('try-catch', async() => {
        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/AA:AA:AA:AA:AA:AA')) {
                expect(options.method).toBe('PUT'); // opcional para checar
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/groups/teste')) {
                expect(options.method).toBe('DELETE');
                return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
            }
            return Promise.reject(new Error('Network Request Error'));
        });

        const result = await remove_group('teste', ['AA:AA:AA:AA:AA:AA', 'FF:FF:FF:FF:FF:FF']);
        expect(result).toBe(false);

        const calls = (fetch as jest.Mock).mock.calls;

        const putAA = calls.find(c => c[0].includes('/clients/AA:AA:AA:AA:AA:AA') && c[1].method === 'PUT');
        const putFF = calls.find(c => c[0].includes('/clients/FF:FF:FF:FF:FF:FF') && c[1].method === 'PUT');
        const deleteGroup = calls.find(c => c[0].includes('/groups/teste') && c[1].method === 'DELETE');

        expect(putAA).toBeDefined();
        expect(putFF).toBeDefined();
        expect(deleteGroup).toBeDefined();

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error'), expect.any(Error));

        expect(fetch).toHaveBeenCalledTimes(8);
    });

    it('try-catch total', async() => {
        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/AA:AA:AA:AA:AA:AA')) {
                expect(options.method).toBe('PUT'); // opcional para checar
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/groups/teste')) {
                expect(options.method).toBe('DELETE');
                return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
            }
            return Promise.reject(new Error('Network Request Error'));
        });

        const result = await remove_group('teste', ['AA:AA:AA:AA:AA:AA', 'FF:FF:FF:FF:FF:FF']);
        expect(result).toBe(false);

        const calls = (fetch as jest.Mock).mock.calls;

        const putAA = calls.find(c => c[0].includes('/clients/AA:AA:AA:AA:AA:AA') && c[1].method === 'PUT');
        const putFF = calls.find(c => c[0].includes('/clients/FF:FF:FF:FF:FF:FF') && c[1].method === 'PUT');
        const deleteGroup = calls.find(c => c[0].includes('/groups/teste') && c[1].method === 'DELETE');

        expect(putAA).toBeDefined();
        expect(putFF).toBeDefined();
        expect(deleteGroup).toBeDefined();

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error'), expect.any(Error));

        expect(fetch).toHaveBeenCalledTimes(8);
    });

    it('try-catch delete', async() => {
        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/AA:AA:AA:AA:AA:AA')) {
                expect(options.method).toBe('PUT'); // opcional para checar
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/groups/teste')) {
                expect(options.method).toBe('DELETE');
                return Promise.reject(new Error('Network Request Error'));
            }
        });

        const result = await remove_group('teste', ['AA:AA:AA:AA:AA:AA', 'FF:FF:FF:FF:FF:FF']);
        expect(result).toBe(false);

        const calls = (fetch as jest.Mock).mock.calls;

        const putAA = calls.find(c => c[0].includes('/clients/AA:AA:AA:AA:AA:AA') && c[1].method === 'PUT');
        const putFF = calls.find(c => c[0].includes('/clients/FF:FF:FF:FF:FF:FF') && c[1].method === 'PUT');
        const deleteGroup = calls.find(c => c[0].includes('/groups/teste') && c[1].method === 'DELETE');

        expect(putAA).toBeDefined();
        expect(putFF).toBeDefined();
        expect(deleteGroup).toBeDefined();

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error'), expect.any(Error));

        expect(fetch).toHaveBeenCalledTimes(8);
    });

    it('try-catch segundo cliente', async() => {
        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/AA:AA:AA:AA:AA:AA')) {
                expect(options.method).toBe('PUT'); // opcional para checar
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.reject(new Error('Network Request Error'));
            }
        });

        const result = await remove_group('teste', ['AA:AA:AA:AA:AA:AA', 'FF:FF:FF:FF:FF:FF']);
        expect(result).toBe(false);

        const calls = (fetch as jest.Mock).mock.calls;

        const putAA = calls.find(c => c[0].includes('/clients/AA:AA:AA:AA:AA:AA') && c[1].method === 'PUT');
        const putFF = calls.find(c => c[0].includes('/clients/FF:FF:FF:FF:FF:FF') && c[1].method === 'PUT');
        const deleteGroup = calls.find(c => c[0].includes('/groups/teste') && c[1].method === 'DELETE');

        expect(putAA).toBeDefined();
        expect(putFF).toBeDefined();
        expect(deleteGroup).toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error'), expect.any(Error));

        expect(fetch).toHaveBeenCalledTimes(7);
    });

    it('try-catch primeiro cliente', async() => {
        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/AA:AA:AA:AA:AA:AA')) {
                expect(options.method).toBe('PUT'); // opcional para checar
                return Promise.reject(new Error('Network Request Error'));
            }
        });

        const result = await remove_group('teste', ['AA:AA:AA:AA:AA:AA', 'FF:FF:FF:FF:FF:FF']);
        expect(result).toBe(false);

        const calls = (fetch as jest.Mock).mock.calls;

        const putAA = calls.find(c => c[0].includes('/clients/AA:AA:AA:AA:AA:AA') && c[1].method === 'PUT');
        const putFF = calls.find(c => c[0].includes('/clients/FF:FF:FF:FF:FF:FF') && c[1].method === 'PUT');
        const deleteGroup = calls.find(c => c[0].includes('/groups/teste') && c[1].method === 'DELETE');

        expect(putAA).toBeDefined();
        expect(putFF).toBeUndefined();
        expect(deleteGroup).toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error'), expect.any(Error));

        expect(fetch).toHaveBeenCalledTimes(5);
    });
  })

    describe('Removendo cliente', () => {
    it('removendo com sucesso', async() => {

        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        const result = await remove_client('FF:FF:FF:FF:FF:FF', 'teste')
        expect(result).toBe(true);

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/clients/FF:FF:FF:FF:FF:FF\\?sid=`));
        expect(lastCall[1].method).toBe('PUT');

        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('response com ok = false', async() => {

        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
            }
        });

        const result = await remove_client('FF:FF:FF:FF:FF:FF', 'teste')
        expect(result).toBe(false);

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/clients/FF:FF:FF:FF:FF:FF\\?sid=`));
        expect(lastCall[1].method).toBe('PUT');

        expect(console.error).toHaveBeenCalledWith('Failed to update client groups')
        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('response com error', async() => {

        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.resolve({ ok: true, json: () => Promise.resolve({
                    error: 'erro'
                }) });
            }
        });

        const result = await remove_client('FF:FF:FF:FF:FF:FF', 'teste')
        expect(result).toBe(false);

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/clients/FF:FF:FF:FF:FF:FF\\?sid=`));
        expect(lastCall[1].method).toBe('PUT');

        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('try-catch', async() => {
        (fetch as jest.Mock).mockImplementation((url, options) => {
            if (url.includes('/clients/FF:FF:FF:FF:FF:FF')) {
                expect(options.method).toBe('PUT');
                return Promise.reject(new Error('Network Request Error'));
            }
        });

        const result = await remove_client('FF:FF:FF:FF:FF:FF', 'teste')
        expect(result).toBe(false);

        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`/clients/FF:FF:FF:FF:FF:FF\\?sid=`));
        expect(lastCall[1].method).toBe('PUT');

        expect(console.error).toHaveBeenCalledWith('Error removing client:', expect.any(Error))
        expect(fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('inserindo cliente em um grupo', () => {

    it('inserindo cliente no grupo com sucesso', async() => {
        (fetch as jest.Mock).mockImplementation(async (url, options) => {
            if (url.includes('/session')) {
                return {
                    ok: true,
                    json: async () => ({ sid: 'teste123' })
                };
            }
            if (url.includes('/groups')) {
                return {
                    ok: true,
                    json: async () => ({ id: 21 })
                };
            }
            if (url.includes('/clients')) {
                return {
                    ok: true,
                    json: async () => ({ processed: { errors: [] } })
                };
            }
            return {
                ok: true,
                json: async () => ({})
            };
        });

        const result = await insert_client_in_group('FF:FF:FF:FF:FF:FF', 'teste');
        expect(result).toBe(true);
        
        expect(fetch).toHaveBeenCalledTimes(5);
    });

    it('deve retornar false', async() => {
        (fetch as jest.Mock).mockImplementation(async (url, options) => {
            if (url.includes('/session')) {
                return {
                    ok: true,
                    json: async () => ({ sid: 'teste123' })
                };
            }
            if (url.includes('/groups')) {
                return {
                    ok: true,
                    json: async () => ({ id: 21 })
                };
            }
            if (url.includes('/clients')) {
                return {
                    ok: true,
                    json: async () => ({ processed: { errors: ['erro'] } })
                };
            }
            return {
                ok: true,
                json: async () => ({})
            };
        });

        const result = await insert_client_in_group('FF:FF:FF:FF:FF:FF', 'teste');
        expect(result).toBe(false);
        
        expect(fetch).toHaveBeenCalledTimes(5);
    });
  })
  
})