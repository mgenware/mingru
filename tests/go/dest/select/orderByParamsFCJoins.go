package da

import (
	"fmt"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGSelectTOrderBy1 int

const (
	PostAGSelectTOrderBy1Sig PostAGSelectTOrderBy1 = iota
)

type PostAGSelectTOrderBy2 int

const (
	PostAGSelectTOrderBy2Title PostAGSelectTOrderBy2 = iota
)

type PostAGSelectTResult struct {
	Title   string
	UserSig *string
}

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable, orderBy1 PostAGSelectTOrderBy1, orderBy1Desc bool, orderBy2 PostAGSelectTOrderBy2, orderBy2Desc bool) ([]PostAGSelectTResult, error) {
	var orderBy1SQL string
	var orderBy1SQLFC string
	switch orderBy1 {
	case PostAGSelectTOrderBy1Sig:
		orderBy1SQL = "`join_1`.`sig`"
		orderBy1SQLFC += ", " + "`db_post`.`id`"
		orderBy1SQLFC += ", " + "`join_1`.`age` DESC"
	default:
		err := fmt.Errorf("unsupported value %v", orderBy1)
		return nil, err
	}
	if orderBy1Desc {
		orderBy1SQL += " DESC"
	}
	orderBy1SQL += orderBy1SQLFC

	var orderBy2SQL string
	switch orderBy2 {
	case PostAGSelectTOrderBy2Title:
		orderBy2SQL = "`db_post`.`title`"
	default:
		err := fmt.Errorf("unsupported value %v", orderBy2)
		return nil, err
	}
	if orderBy2Desc {
		orderBy2SQL += " DESC"
	}

	rows, err := mrQueryable.Query("SELECT `db_post`.`title`, `join_1`.`sig` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` ORDER BY `db_post`.`title`, "+orderBy1SQL+", "+orderBy2SQL)
	if err != nil {
		return nil, err
	}
	var result []PostAGSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostAGSelectTResult
		err = rows.Scan(&item.Title, &item.UserSig)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
