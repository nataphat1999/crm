<?php

namespace app\models;

use Yii;
use app\libs\Constant;

class TravelExpenseItem extends \yii\db\ActiveRecord
{
    public static function tableName()
    {
        return '{{%travel_expense_item}}';
    }

    public function rules()
    {
        return [
            // [['travel_expense_id', 'item_date', 'description', 'amount'], 'required'],
            [['travel_expense_id', 'project_id', 'created_by', 'updated_by'], 'integer'],
            [['item_date', 'created_at', 'updated_at'], 'safe'],
            [['description'], 'string'],
            [['other_items_price', 'starting_mileage', 'end_mileage', 'distance', 'travel_price', 'amount'], 'number'],
            [['travel_start', 'travel_end', 'other_items'], 'string', 'max' => 255],
            [['car_type'], 'string', 'max' => 10],
            [['travel_expense_id'], 'exist', 'skipOnError' => true, 'targetClass' => TravelExpense::class, 'targetAttribute' => ['travel_expense_id' => 'id']],
            [['project_id'], 'exist', 'skipOnError' => true, 'targetClass' => Project::class, 'targetAttribute' => ['project_id' => 'id']],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => Yii::t('app', 'ID'),
            'travel_expense_id' => Yii::t('app', 'Travel Expense ID'),
            'item_date' => Yii::t('travel_expense', 'Travel Date'),
            'project_id' => Yii::t('app', 'Project Code'),
            'description' => Yii::t('travel_expense', 'Operation'),
            'travel_start' => Yii::t('travel_expense', 'Starting Point'),
            'travel_end' => Yii::t('travel_expense', 'End Point'),
            'other_items' => Yii::t('travel_expense', 'Other Items'),
            'other_items_price' => Yii::t('travel_expense', 'Other Items Price'),
            'car_type' => Yii::t('travel_expense', 'Private Car Type'),
            'starting_mileage' => Yii::t('travel_expense', 'Starting Mileage'),
            'end_mileage' => Yii::t('travel_expense', 'End Mileage'),
            'distance' => Yii::t('travel_expense', 'Distance'),
            'travel_price' => Yii::t('travel_expense', 'Travel Price'),
            'amount' => Yii::t('travel_expense', 'Item Amount'),
            'created_at' => Yii::t('app', 'Created At'),
            'updated_at' => Yii::t('app', 'Updated At'),
            'created_by' => Yii::t('app', 'Created By'),
            'updated_by' => Yii::t('app', 'Updated By'),
        ];
    }

    public function getTravelExpense()
    {
        return $this->hasOne(TravelExpense::class, ['id' => 'travel_expense_id']);
    }

    public function getProject()
    {
        return $this->hasOne(Project::class, ['id' => 'project_id']);
    }
}