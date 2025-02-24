import { EFilterDate } from "@/constant";
import { ETXTYPE } from "@/constant/stake";
import { IBasicModel } from "@/types/model";

export interface IStakingModel extends IBasicModel {
    txAddress: string;
    txDate: Date;
    amount: number;
    txAmount: number;
    txStatus: string;
    txHash: string;
    txType: ETXTYPE;
}

export type TCreatedStakingPayload = {
    address: string;
    amount?: number;
    txHash: string;
    txDate: Date;
    txType: ETXTYPE;
}

export type TGetStakeHistoryPayload = {
    address: string;
    timeStamp: EFilterDate;
}

export type TGetActivitiesPayload = {
    offset: number;
    limit: number;
    address: string;
}

export interface IGetStakeHistory {
    xData: string[];
    yData: number[];
}

export interface IGetUserActivity {
    count: number;
    items: Array<Partial<IStakingModel>>
}