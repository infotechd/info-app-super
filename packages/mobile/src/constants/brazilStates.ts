// Lista de estados do Brasil com UF, nome e capital
// Usada para seleção de estado e preenchimento automático da cidade
export interface BrazilState {
  uf: string;
  nome: string;
  capital: string;
}

export const BRAZIL_STATES: BrazilState[] = [
  { uf: 'AC', nome: 'Acre', capital: 'Rio Branco' },
  { uf: 'AL', nome: 'Alagoas', capital: 'Maceió' },
  { uf: 'AP', nome: 'Amapá', capital: 'Macapá' },
  { uf: 'AM', nome: 'Amazonas', capital: 'Manaus' },
  { uf: 'BA', nome: 'Bahia', capital: 'Salvador' },
  { uf: 'CE', nome: 'Ceará', capital: 'Fortaleza' },
  { uf: 'DF', nome: 'Distrito Federal', capital: 'Brasília' },
  { uf: 'ES', nome: 'Espírito Santo', capital: 'Vitória' },
  { uf: 'GO', nome: 'Goiás', capital: 'Goiânia' },
  { uf: 'MA', nome: 'Maranhão', capital: 'São Luís' },
  { uf: 'MT', nome: 'Mato Grosso', capital: 'Cuiabá' },
  { uf: 'MS', nome: 'Mato Grosso do Sul', capital: 'Campo Grande' },
  { uf: 'MG', nome: 'Minas Gerais', capital: 'Belo Horizonte' },
  { uf: 'PA', nome: 'Pará', capital: 'Belém' },
  { uf: 'PB', nome: 'Paraíba', capital: 'João Pessoa' },
  { uf: 'PR', nome: 'Paraná', capital: 'Curitiba' },
  { uf: 'PE', nome: 'Pernambuco', capital: 'Recife' },
  { uf: 'PI', nome: 'Piauí', capital: 'Teresina' },
  { uf: 'RJ', nome: 'Rio de Janeiro', capital: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte', capital: 'Natal' },
  { uf: 'RS', nome: 'Rio Grande do Sul', capital: 'Porto Alegre' },
  { uf: 'RO', nome: 'Rondônia', capital: 'Porto Velho' },
  { uf: 'RR', nome: 'Roraima', capital: 'Boa Vista' },
  { uf: 'SC', nome: 'Santa Catarina', capital: 'Florianópolis' },
  { uf: 'SP', nome: 'São Paulo', capital: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe', capital: 'Aracaju' },
  { uf: 'TO', nome: 'Tocantins', capital: 'Palmas' },
];

export default BRAZIL_STATES;
