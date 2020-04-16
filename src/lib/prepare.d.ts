import { AdapterBase } from 'lib/adapterBase';
import { Prepared } from '../types';
export declare const prepare: (adapter: AdapterBase, name: string, ...args: any[]) => (prepareTemplate: TemplateStringsArray, prepareArgs?: any[] | undefined) => Prepared;
