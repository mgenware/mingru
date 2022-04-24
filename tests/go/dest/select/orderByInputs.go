package da

import (
	"fmt"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

const (
	PostTableSelectTOrderBy1N = iota
	PostTableSelectTOrderBy1Title
	PostTableSelectTOrderBy1CmtCount
)

const (
	PostTableSelectTOrderBy2N = iota
	PostTableSelectTOrderBy2Title
)

type PostTableSelectTResult struct {
	ID    uint64
	N     int
	Title string
}

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable, id uint64, orderBy1 int, orderBy1Desc bool, orderBy2 int, orderBy2Desc bool) ([]PostTableSelectTResult, error) {
	var orderBy1SQL string
	switch orderBy1 {
	case PostTableSelectTOrderBy1N:
		orderBy1SQL = "`n`"
	case PostTableSelectTOrderBy1Title:
		orderBy1SQL = "`title`"
	case PostTableSelectTOrderBy1CmtCount:
		orderBy1SQL = "`cmt_c`"
	default:
		err := fmt.Errorf("Unsupported value %v", orderBy1)
		return nil, err
	}
	if orderBy1Desc {
		orderBy1SQL += " DESC"
	}

	var orderBy2SQL string
	switch orderBy2 {
	case PostTableSelectTOrderBy2N:
		orderBy2SQL = "`n`"
	case PostTableSelectTOrderBy2Title:
		orderBy2SQL = "`title`"
	default:
		err := fmt.Errorf("Unsupported value %v", orderBy2)
		return nil, err
	}
	if orderBy2Desc {
		orderBy2SQL += " DESC"
	}

	rows, err := mrQueryable.Query("SELECT `id`, RAND() AS `n`, `title` FROM `db_post` WHERE `id` = ? ORDER BY `title`, "+orderBy1SQL+", "+orderBy2SQL, id)
	if err != nil {
		return nil, err
	}
	var result []PostTableSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableSelectTResult
		err = rows.Scan(&item.ID, &item.N, &item.Title)
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
