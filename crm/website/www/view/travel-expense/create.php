<?php

use yii\helpers\Html;
use yii\helpers\Json;
use yii\base\Model;

$this->title = Yii::t('app', 'Travel Expense Request');
$this->params['breadcrumbs'][] = ['label' => $this->title, 'url' => ['index'], 'template' => "<li class=\"breadcrumb-item\">{link}</li>\n"];
$this->params['breadcrumbs'][] = ['label' => Yii::t('app', 'Create Travel Expense Request'), 'template' => "<li class=\"breadcrumb-item\">{link}</li>\n"];

?>
<div class="travel-expense-create">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <?= $this->render('_form', [
                        'model' => $model,
                        'payToUsers' => $payees,
                        'users' => $users,
                        'departments' => $departments,
                        'projects' => $projects,
                        'positions' => $positions,
                        'usersData' => $usersData,
                        'payeesData' => $payeesData,
                        'projectsJson' => $projectsJson,
                        'modelsApproval' => $modelsApproval ?? [],
                        'signaturesData' => $signaturesData ?? [],
                        'level2_approverId' => $level2_approverId ?? null,
                        'level3Approvers' => $level3Approvers ?? [],
                        'level5Approvers' => $level5Approvers ?? [],
                        'modelsItem' => $modelsItem,
                    ]) ?>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
if ($model->hasErrors() || (isset($modelsItem) && Model::validateMultiple($modelsItem) === false)) {
    $mainErrors = Json::encode($model->getErrors());
    $itemErrors = [];
    if (isset($modelsItem)) {
        foreach ($modelsItem as $index => $item) {
            if ($item->hasErrors()) {
                $itemErrors[$index] = $item->getErrors();
            }
        }
    }
    $itemErrorsJson = Json::encode($itemErrors);

    $this->registerJs("
        console.group('%c Validation Error Details ', 'background: #ff0000; color: #ffffff; font-weight: bold;');
        console.log('Main Model Errors:', JSON.parse('" . addslashes($mainErrors) . "'));
        console.log('Items Errors:', JSON.parse('" . addslashes($itemErrorsJson) . "'));
        console.groupEnd();
    ", \yii\web\View::POS_READY);
}
?>