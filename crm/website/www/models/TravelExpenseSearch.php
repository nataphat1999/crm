<?php

namespace app\models;

use yii\base\Model;
use yii\data\ActiveDataProvider;
use app\models\TravelExpense;

class TravelExpenseSearch extends TravelExpense
{
    public function rules()
    {
        return [
            [['id', 'requestor_id', 'employee_id', 'department_id', 'status', 'created_by', 'updated_by'], 'integer'],
            [['total_receipt_amount', 'total_mileage_expense', 'total_other_expense', 'total_grand'], 'number'],
            [['code', 'request_date', 'purpose', 'remark_short', 'payment_method', 'transfer_account_number', 'transfer_bank_branch', 'cheque_date', 'cheque_account_number', 'cheque_bank_branch', 'remark_long', 'created_at', 'updated_at'], 'safe'],
        ];
    }

    public function scenarios()
    {
        return Model::scenarios();
    }

    public function search($params)
    {
        $query = TravelExpense::find();

        $dataProvider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => false,
        ]);

        $this->load($params);

        if (!$this->validate()) {
            return $dataProvider;
        }

        $query->andFilterWhere([
            'id' => $this->id,
            'request_date' => $this->request_date,
            'requestor_id' => $this->requestor_id,
            'employee_id' => $this->employee_id,
            'department_id' => $this->department_id,
            'total_receipt_amount' => $this->total_receipt_amount,
            'total_mileage_expense' => $this->total_mileage_expense,
            'total_other_expense' => $this->total_other_expense,
            'total_grand' => $this->total_grand,
            'cheque_date' => $this->cheque_date,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
        ]);

        $query->andFilterWhere(['like', 'code', $this->code])
            ->andFilterWhere(['like', 'purpose', $this->purpose])
            ->andFilterWhere(['like', 'remark_short', $this->remark_short])
            ->andFilterWhere(['like', 'payment_method', $this->payment_method])
            ->andFilterWhere(['like', 'transfer_account_number', $this->transfer_account_number])
            ->andFilterWhere(['like', 'transfer_bank_branch', $this->transfer_bank_branch])
            ->andFilterWhere(['like', 'cheque_account_number', $this->cheque_account_number])
            ->andFilterWhere(['like', 'cheque_bank_branch', $this->cheque_bank_branch])
            ->andFilterWhere(['like', 'remark_long', $this->remark_long]);

        return $dataProvider;
    }
}