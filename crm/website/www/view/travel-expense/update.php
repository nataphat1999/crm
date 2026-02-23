<?php

use yii\helpers\Html;
use app\models\TravelExpense;
use app\models\TravelExpenseItem;
use yii\web\View; 
use yii\helpers\ArrayHelper;

$this->title = Yii::t('app', 'Travel Expense Request');
$this->params['breadcrumbs'][] = ['label' => Yii::t('app', 'Travel Expense Request'), 'url' => ['index'], 'template' => "<li class=\"breadcrumb-item\">{link}</li>\n"];
$this->params['breadcrumbs'][] = ['label' => Yii::t('app', 'Update Travel Expense Request'), 'template' => "<li class=\"breadcrumb-item\">{link}</li>\n"];

$this->registerJs("
    console.log('--- Debugging Update Page Data ---');
    console.log('Model Attributes:', " . json_encode($model->attributes) . ");
    console.log('Models Item (Data sent from Controller):', " . json_encode(ArrayHelper::toArray($modelsItem)) . ");
    console.log('Approval Models:', " . json_encode(ArrayHelper::toArray($modelsApproval)) . ");
    console.log('Signatures Data:', " . json_encode($signaturesData) . ");
", View::POS_END);

?>

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <?= $this->render('_form', [
                    'model' => $model,
                    'modelsItem' => $modelsItem,
                    'users' => $users, 
                    'payees' => $payees,
                    'payToUsers' => $payToUsers,
                    'departments' => $departments,
                    'projects' => $projects,
                    'positions' => $positions,
                    'usersData' => $usersData,
                    'payeesData' => $payeesData,
                    'projectsJson' => $projectsJson,
                    'modelItem' => $modelItem,
                    'modelsApproval' => $modelsApproval, 
                    'signaturesData' => $signaturesData, 
                    'level3Approvers' => $level3Approvers,
                    'level5Approvers' => $level5Approvers,
                ]) ?>
            </div>
        </div>
    </div>
</div>